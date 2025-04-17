const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const westernTeams = ['Jets', 'Blues', 'Stars', 'Avs', 'Vegas', 'Wild', 'Kings', 'Oilers'];
const easternTeams = ['Leafs', 'Sens', 'Tampa', 'Panthers', 'Caps', 'Habs', 'Canes', 'Devils'];

async function generateBracketImage(predictions, userId, fullRound1Matchups) {
  console.log(`[DEBUG] Generating bracket for ${userId}:`, JSON.stringify(predictions, null, 2));

  const westernDefaults = [];
const easternDefaults = [];

fullRound1Matchups.forEach(([teamA, teamB]) => {
  if (westernTeams.includes(teamA) && westernTeams.includes(teamB)) {
    westernDefaults.push(teamA, teamB);
  } else if (easternTeams.includes(teamA) && easternTeams.includes(teamB)) {
    easternDefaults.push(teamA, teamB);
  }
});

  
  const westernPredictions = {
    round1: [],
    round2: [],
    round3: []
  };
  
  const easternPredictions = {
    round1: [],
    round2: [],
    round3: []
  };
  
fullRound1Matchups.forEach(([teamA, teamB]) => {
    if (westernTeams.includes(teamA) && westernTeams.includes(teamB)) {
      westernPredictions.round1.push(teamA, teamB);
    } else if (easternTeams.includes(teamA) && easternTeams.includes(teamB)) {
      easternPredictions.round1.push(teamA, teamB);
    }
  });
  
if (predictions.round1 && predictions.round1.length > 0) {
    predictions.round1.forEach(team => {
      if (westernTeams.includes(team)) {
        westernPredictions.round1.push(team);
      } else if (easternTeams.includes(team)) {
        easternPredictions.round1.push(team);
      }
    });
  }
  
  
  if (predictions.round2 && predictions.round2.length > 0) {
    const westernCount = Math.min(predictions.round2.length / 2, 4);
    for (let i = 0; i < westernCount; i++) {
      westernPredictions.round2.push(predictions.round2[i]);
    }
    
    for (let i = westernCount; i < predictions.round2.length; i++) {
      easternPredictions.round2.push(predictions.round2[i]);
    }
  }
  
  if (predictions.round3 && predictions.round3.length > 0) {
    if (predictions.round3[0]) {
      westernPredictions.round3.push(predictions.round3[0]);
    }
    
    if (predictions.round3[1]) {
      easternPredictions.round3.push(predictions.round3[1]);
    }
  }
  
  const htmlPath = path.join(__dirname, `bracket-${userId}.html`);
  const htmlContent = generateHTML(westernDefaults, westernPredictions, easternDefaults, easternPredictions, predictions.round4);

  
  fs.writeFileSync(htmlPath, htmlContent);
  
  const fileUrl = `file://${htmlPath.replace(/\\/g, '/')}`;
  console.log(`[DEBUG] Created bracket HTML at: ${fileUrl}`);
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 900 });
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const screenshotPath = path.join(__dirname, `bracket-${userId}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    
    return screenshotPath;
  } finally {
    await browser.close();
  }
}

function generateHTML(westernDefaults, westernPredictions, easternDefaults, easternPredictions, winner) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>NHL Playoff Bracket</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      background: #f4f4f4;
      padding: 20px;
      margin: 0;
    }
    .bracket-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1200px;
      margin: 0 auto;
    }
    .conference {
      width: 45%;
    }
    .conference-title {
      text-align: center;
      color: #0066cc;
      margin-bottom: 20px;
      font-size: 24px;
      font-weight: bold;
      border-bottom: 2px solid #0066cc;
      padding-bottom: 5px;
    }
    .bracket {
      display: flex;
      justify-content: space-between;
    }
    .round {
      display: flex;
      flex-direction: column;
      width: 31%;
    }
    .round-title {
      font-weight: bold;
      text-align: center;
      margin-bottom: 10px;
      color: #333;
    }
    .matchups {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .matchup {
      background: white;
      padding: 8px 10px;
      margin: 5px 0;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      font-size: 14px;
      position: relative;
    }
    .east-round .matchup {
      text-align: right;
    }
    .west-round {
      align-items: flex-start;
    }
    .east-round {
      align-items: flex-end;
    }
    .final-round {
      width: 10%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
    .winner {
      background: #ffd700;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      font-weight: bold;
      font-size: 18px;
      text-align: center;
      margin-top: 20px;
    }
    .trophy {
      font-size: 40px;
      margin-bottom: 10px;
    }
    h1 {
      text-align: center;
      color: #333;
      margin-bottom: 30px;
    }
    .vs {
      color: #999;
      font-size: 12px;
      margin: 0 5px;
    }
  </style>
</head>
<body>
  <h1>NHL Playoff Bracket</h1>
  
  <div class="bracket-container">
    <!-- Western Conference -->
<div class="conference">
  <div class="conference-title">Western Conference</div>
  <div class="bracket">
    <div class="round west-round">
      <div class="round-title">Matchups</div>
      <div class="matchups">
        ${generateMatchups(westernPredictions.round1)}
      </div>
    </div>
    <div class="round west-round">
      <div class="round-title">Round 1</div>
      <div class="matchups">
        ${generateMatchups(westernDefaults)}
      </div>
    </div>
    <div class="round west-round">
      <div class="round-title">Round 2</div>
      <div class="matchups">
        ${generateMatchups(westernPredictions.round2)}
      </div>
    </div>
    <div class="round west-round">
      <div class="round-title">Conference Final</div>
      <div class="matchups">
        ${westernPredictions.round3[0] ? `<div class="matchup">${westernPredictions.round3[0]}</div>` : ''}
      </div>
    </div>
  </div>
</div>
    
    <!-- Stanley Cup Final -->
    <div class="final-round">
      <div class="round-title">Stanley Cup Final</div>
      ${winner ? `
        <div class="winner">
          <div class="trophy">🏆</div>
          ${winner}
        </div>
      ` : ''}
    </div>
    
    <!-- Eastern Conference -->
<div class="conference">
  <div class="conference-title">Eastern Conference</div>
  <div class="bracket" style="flex-direction: row-reverse;">
    <div class="round east-round">
      <div class="round-title">Matchups</div>
      <div class="matchups">
        ${generateMatchups(easternPredictions.round1)}
      </div>
    </div>
    <div class="round east-round">
      <div class="round-title">Round 1</div>
      <div class="matchups">
        ${generateMatchups(easternDefaults)}
      </div>
    </div>
    <div class="round east-round">
      <div class="round-title">Round 2</div>
      <div class="matchups">
        ${generateMatchups(easternPredictions.round2)}
      </div>
    </div>
    <div class="round east-round">
      <div class="round-title">Conference Final</div>
      <div class="matchups">
        ${easternPredictions.round3[0] ? `<div class="matchup">${easternPredictions.round3[0]}</div>` : ''}
      </div>
    </div>
  </div>
</div>





  </div>
</body>
</html>`;
}

function generateMatchups(teams) {
  if (!teams || teams.length === 0) return '';
  
  let html = '';
  for (let i = 0; i < teams.length; i += 2) {
    if (teams[i] && teams[i+1]) {
      html += `<div class="matchup">${teams[i]} <span class="vs">vs</span> ${teams[i+1]}</div>`;
    } else if (teams[i]) {
      html += `<div class="matchup">${teams[i]}</div>`;
    }
  }
  return html;
}

module.exports = generateBracketImage;