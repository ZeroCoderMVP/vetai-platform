const fs = require('fs');

const file = 'src/app/dashboard/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const startTag = '{/* Main content: 2-column layout */}';
const endTag = '{/* Groups table */}';

const startIndex = content.indexOf(startTag);
const endIndex = content.indexOf(endTag);

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find boundaries");
    process.exit(1);
}

const section = content.substring(startIndex, endIndex);

function extractCard(marker) {
    const idx = section.indexOf(marker);
    if (idx === -1) return null;
    let cardStart = section.indexOf('<div className="card">', idx);
    let openConnts = 0;
    let endIdx = -1;
    let inCard = false;
    
    for (let i = cardStart; i < section.length; i++) {
        if (section.substr(i, 4) === '<div') {
            openConnts++;
            inCard = true;
        } else if (section.substr(i, 5) === '</div') {
            openConnts--;
        }
        if (inCard && openConnts === 0) {
            endIdx = i + 6;
            break;
        }
    }
    return section.substring(cardStart, endIdx);
}

const cFeedGroup = extractCard('{/* Left: Feed by group chart */}');
const cEvents = extractCard('{/* Right: Events feed */}');
const cRisks = extractCard('{/* Focus on Risks / Фокус на рисках */}');
const cDryMatter = extractCard('{/* Right column: Сухое вещество */}');
const cSCC = extractCard('{/* SCC */}');
const cRepro = extractCard('{/* Воспроизводство */}');

const newLayout = `      {/* Main content: 2-column layout */}
      <div className="grid-dashboard" style={{ alignItems: "start" }}>
        
        {/* === LEFT COLUMN === */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {/* Left: Feed by group chart */}
${cFeedGroup ? "          " + cFeedGroup.split('\n').join('\n          ') : ""}

          {/* Focus on Risks / Фокус на рисках */}
${cRisks ? "          " + cRisks.split('\n').join('\n          ') : ""}
        </div>

        {/* === RIGHT COLUMN === */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {/* Right: Events feed */}
${cEvents ? "          " + cEvents.split('\n').join('\n          ') : ""}

          {/* Right column: Сухое вещество */}
${cDryMatter ? "          " + cDryMatter.split('\n').join('\n          ') : ""}

          {/* SCC */}
${cSCC ? "          " + cSCC.split('\n').join('\n          ') : ""}

          {/* Воспроизводство */}
${cRepro ? "          " + cRepro.split('\n').join('\n          ') : ""}
        </div>
      </div>

`;

content = content.substring(0, startIndex) + newLayout + content.substring(endIndex);

fs.writeFileSync(file, content);
console.log("Successfully rebuilt layout!");
