const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const westernTeams = ['Jets', 'Blues', 'Stars', 'Avs', 'Vegas', 'Wild', 'Kings', 'Oilers'];
const easternTeams = ['Leafs', 'Sens', 'Tampa', 'Panthers', 'Caps', 'Habs', 'Canes', 'Devils'];

async function generateBracketImage(predictions, userId, fullRound1Matchups) {
  const westernMatchups = fullRound1Matchups.filter(([a]) => westernTeams.includes(a));
  const easternMatchups = fullRound1Matchups.filter(([a]) => easternTeams.includes(a));

  const westernR1 = predictions.round1?.filter(t => westernTeams.includes(t)) || [];
  const westernR2 = predictions.round2?.filter(t => westernTeams.includes(t)) || [];
  const westernR3 = predictions.round3?.[0] && westernTeams.includes(predictions.round3[0]) ? [predictions.round3[0]] : [];

  const easternR1 = predictions.round1?.filter(t => easternTeams.includes(t)) || [];
  const easternR2 = predictions.round2?.filter(t => easternTeams.includes(t)) || [];
  const easternR3 = predictions.round3?.[1] && easternTeams.includes(predictions.round3[1]) ? [predictions.round3[1]] : [];

  const htmlPath = path.join(__dirname, `bracket-${userId}.html`);
  const htmlContent = generateHTML(
    westernMatchups, westernR1, westernR2, westernR3,
    easternMatchups, easternR1, easternR2, easternR3,
    predictions.round4
  );

  fs.writeFileSync(htmlPath, htmlContent);
  const fileUrl = `file://${htmlPath.replace(/\\/g, '/')}`;

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
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

function generateHTML(westM, westR1, westR2, westR3, eastM, eastR1, eastR2, eastR3, winner) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>NHL Playoff Bracket</title>
  <style>
    body {
      font-family: Arial, sans-serif;
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
      width: 23%;
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
    }
    .matchup {
      background: white;
      padding: 8px 10px;
      margin: 5px 0;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      font-size: 14px;
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
  </style>
</head>
<body>
  <h1>NHL Playoff Bracket</h1>
  <div class="bracket-container">
    <div class="conference">
      <div class="conference-title">Western Conference</div>
      <div class="bracket">
        <div class="round west-round"><div class="round-title">Matchups</div><div class="matchups">${generateMatchupsFromPairs(westM)}</div></div>
        <div class="round west-round"><div class="round-title">Round 1</div><div class="matchups">${generateMatchups(westR1)}</div></div>
        <div class="round west-round"><div class="round-title">Round 2</div><div class="matchups">${generateMatchups(westR2)}</div></div>
        <div class="round west-round"><div class="round-title">Conference Final</div><div class="matchups">${generateMatchups(westR3)}</div></div>
      </div>
    </div>

    <div class="final-round">
      <div class="round-title">Stanley Cup Final</div>
      ${winner ? `<div class="winner"><div class="trophy">🏆</div>${winner}</div>` : ''}
    </div>

    <div class="conference">
      <div class="conference-title">Eastern Conference</div>
      <div class="bracket" style="flex-direction: row-reverse;">
        <div class="round east-round"><div class="round-title">Matchups</div><div class="matchups">${generateMatchupsFromPairs(eastM)}</div></div>
        <div class="round east-round"><div class="round-title">Round 1</div><div class="matchups">${generateMatchups(eastR1)}</div></div>
        <div class="round east-round"><div class="round-title">Round 2</div><div class="matchups">${generateMatchups(eastR2)}</div></div>
        <div class="round east-round"><div class="round-title">Conference Final</div><div class="matchups">${generateMatchups(eastR3)}</div></div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function generateMatchups(teams) {
  let html = '';
  for (let i = 0; i < teams.length; i += 2) {
    if (teams[i + 1]) {
      html += `<div class="matchup">${teams[i]} <span class="vs">vs</span> ${teams[i + 1]}</div>`;
    } else {
      html += `<div class="matchup">${teams[i]}</div>`;
    }
  }
  return html;
}

function generateMatchupsFromPairs(pairs) {
  return pairs.map(([a, b]) => `<div class="matchup">${a} <span class="vs">vs</span> ${b}</div>`).join('');
}

module.exports = generateBracketImage;
