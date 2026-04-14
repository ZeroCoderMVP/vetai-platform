const fs = require('fs');

const file = 'src/app/dashboard/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const s1 = content.indexOf('{/* Main content: 2-column layout */}');
const s2 = content.indexOf('{/* Groups table */}');

if (s1 === -1 || s2 === -1) {
    console.error("Bounds not found");
    process.exit(1);
}

// Extract exact cards by searching for their surrounding comments
const iFeed = content.indexOf('{/* Left: Feed by group chart */}');
const iEvents = content.indexOf('{/* Right: Events feed */}');
const iRisks = content.indexOf('{/* Focus on Risks / Фокус на рисках */}');
const iDry = content.indexOf('{/* Right column: Сухое вещество */}');
const iSCC = content.indexOf('{/* SCC */}');
const iRepro = content.indexOf('{/* Воспроизводство */}');

// The end of a card is approximately just before the next card's comment
// Except for iRepro, which ends before `</div> </div>` at the end of the section.
// To be safe, we extract from iFeed to just before iEvents.
// BUT we MUST strip the trailing `</div>` and wrappers between cards.

// Since the cards themselves do NOT contain the wrapper divs, let's just 
// extract from `<div className="card">` down to the next comment, and then
// right trim. BUT we know EXACTLY what is between the cards!
// Actually, it's easier to just do:

let cFeed = content.substring(content.indexOf('<div className="card">', iFeed), iEvents);
let cEvents = content.substring(content.indexOf('<div className="card">', iEvents), content.lastIndexOf('</div>', iRisks));
let cRisks = content.substring(content.indexOf('<div className="card">', iRisks), iDry);
let cDry = content.substring(content.indexOf('<div className="card">', iDry), iSCC);
let cSCC = content.substring(content.indexOf('<div className="card">', iSCC), iRepro);
let cRepro = content.substring(content.indexOf('<div className="card">', iRepro), s2);

// We need to clean up the trailing wrapper `</div>` elements from cEvents and cRepro.
// `cEvents` currently includes `</div>` for the first grid-dashboard and `<div className="grid-dashboard">` for the second.
// Let's just find the LAST `</div>` that belongs to the card.
function cleanCard(c) {
    // Find the last </div>
    let lastDiv = c.lastIndexOf('</div>');
    return c.substring(0, lastDiv + 6);
}

cFeed = cleanCard(cFeed);
// cEvents currently has `</div>` from the card, then `</div>` from right column (wait, there was no right column), then `</div>` from grid, then `<div className="grid-dashboard">`.
// To properly clean, we just find the LAST `</div>` OF THE CARD.
// Let's just split out the raw cards by searching for `<div className="card">` and counting `</div>` using a BETTER PARSER that handles `<div />`.

function parseCardProperly(content, startIdx) {
    let openConnts = 0;
    let endIdx = -1;
    let inCard = false;
    for (let i = startIdx; i < content.length; i++) {
        // match <div optionally with spaces, but NOT <div/>
        if (content.substr(i, 4) === '<div') {
            // Check if it's self closing by searching forward for `/>` or `>`
            let j = i + 4;
            while(j < content.length && content[j] !== '>') j++;
            if (content[j-1] !== '/') {
                openConnts++;
                inCard = true;
            }
        } else if (content.substr(i, 6) === '</div>') {
            openConnts--;
            if (inCard && openConnts === 0) {
                endIdx = i + 6;
                break;
            }
        }
    }
    return content.substring(startIdx, endIdx);
}

cFeed = parseCardProperly(content, content.indexOf('<div className="card">', iFeed));
cEvents = parseCardProperly(content, content.indexOf('<div className="card">', iEvents));
cRisks = parseCardProperly(content, content.indexOf('<div className="card">', iRisks));
cDry = parseCardProperly(content, content.indexOf('<div className="card">', iDry));
cSCC = parseCardProperly(content, content.indexOf('<div className="card">', iSCC));
cRepro = parseCardProperly(content, content.indexOf('<div className="card">', iRepro));

const newLayout = `      {/* Main content: 2-column layout */}
      <div className="grid-dashboard" style={{ alignItems: "start" }}>

        {/* === LEFT COLUMN === */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {/* Left: Feed by group chart */}
          ${cFeed}

          {/* Focus on Risks / Фокус на рисках */}
          ${cRisks}
        </div>

        {/* === RIGHT COLUMN === */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {/* Right: Events feed */}
          ${cEvents}

          {/* Right column: Сухое вещество */}
          ${cDry}

          {/* SCC */}
          ${cSCC}

          {/* Воспроизводство */}
          ${cRepro}
        </div>
      </div>

`;

content = content.substring(0, s1) + newLayout + content.substring(s2);
fs.writeFileSync(file, content);
console.log("Successfully rebuilt layout!");
