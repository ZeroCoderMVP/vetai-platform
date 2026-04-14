const fs = require('fs');

const file = 'src/app/dashboard/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const s1 = content.indexOf('{/* Main content: 2-column layout */}');
const s2 = content.indexOf('{/* Groups table */}');

if (s1 === -1 || s2 === -1) {
    console.error("Bounds not found");
    process.exit(1);
}

const iFeed = content.indexOf('{/* Left: Feed by group chart */}');
const iEvents = content.indexOf('{/* Right: Events feed */}');
const iRisks = content.indexOf('{/* Focus on Risks / Фокус на рисках */}');
const iDry = content.indexOf('{/* Right column: Сухое вещество */}');
const iSCC = content.indexOf('{/* SCC */}');
const iRepro = content.lastIndexOf('{/* Воспроизводство */}');

function parseCardProperly(content, startIdx) {
    let openConnts = 0;
    let endIdx = -1;
    let inCard = false;
    for (let i = startIdx; i < content.length; i++) {
        if (content.substr(i, 4) === '<div') {
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

let cFeed = parseCardProperly(content, content.indexOf('<div className="card">', iFeed));
let cEvents = parseCardProperly(content, content.indexOf('<div className="card">', iEvents));
let cRisks = parseCardProperly(content, content.indexOf('<div className="card">', iRisks));
let cDry = parseCardProperly(content, content.indexOf('<div className="card">', iDry));
let cSCC = parseCardProperly(content, content.indexOf('<div className="card">', iSCC));
let cRepro = parseCardProperly(content, content.indexOf('<div className="card">', iRepro));

// Fix the SCC green bar Math formula inside cSCC before injecting it
cSCC = cSCC.replace(
    /Math\.max\(farmData\.milkingSummary\.totalCows, 1\)/g,
    "Math.max(farmData.milkingSummary.bySCC.normal + farmData.milkingSummary.bySCC.elevated + farmData.milkingSummary.bySCC.high, 1)"
);

const newLayout = `      {/* Main content: 2-column layout */}
      <div className="grid-dashboard" style={{ alignItems: "start" }}>
        {/* Left: Feed by group chart */}
        ${cFeed}

        {/* Right: Events feed */}
        ${cEvents}
      </div>

      {/* Row 2: 3 small KPI cards */}
      <div className="grid-3" style={{ marginTop: "var(--space-4)", alignItems: "start" }}>
        {/* Сухое вещество */}
        ${cDry}

        {/* SCC */}
        ${cSCC}

        {/* Воспроизводство */}
        ${cRepro}
      </div>

      {/* Row 3: Focus on Risks (Full width) */}
      <div style={{ marginTop: "var(--space-4)" }}>
        ${cRisks}
      </div>

`;

content = content.substring(0, s1) + newLayout + content.substring(s2);
fs.writeFileSync(file, content);
console.log("Successfully rebuilt layout!");
