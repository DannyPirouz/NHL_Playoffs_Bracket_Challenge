const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const westernTeams = ['Jets', 'Blues', 'Stars', 'Avs', 'Vegas', 'Wild', 'Kings', 'Oilers'];
const easternTeams = ['Leafs', 'Sens', 'Tampa', 'Panthers', 'Caps', 'Habs', 'Canes', 'Devils'];

const teamLogos = {
  'Jets': 'https://assets.nhle.com/logos/nhl/svg/WPG_light.svg',
  'Blues': 'https://assets.nhle.com/logos/nhl/svg/STL_light.svg',
  'Stars': 'https://assets.nhle.com/logos/nhl/svg/DAL_light.svg',
  'Avs': 'https://assets.nhle.com/logos/nhl/svg/COL_light.svg',
  'Vegas': 'https://assets.nhle.com/logos/nhl/svg/VGK_light.svg',
  'Wild': 'https://assets.nhle.com/logos/nhl/svg/MIN_light.svg',
  'Kings': 'https://assets.nhle.com/logos/nhl/svg/LAK_light.svg',
  'Oilers': 'https://assets.nhle.com/logos/nhl/svg/EDM_light.svg',
  'Leafs': 'https://assets.nhle.com/logos/nhl/svg/TOR_light.svg',
  'Sens': 'https://assets.nhle.com/logos/nhl/svg/OTT_light.svg',
  'Tampa': 'https://assets.nhle.com/logos/nhl/svg/TBL_light.svg',
  'Panthers': 'https://assets.nhle.com/logos/nhl/svg/FLA_light.svg',
  'Caps': 'https://assets.nhle.com/logos/nhl/svg/WSH_light.svg',
  'Habs': 'https://assets.nhle.com/logos/nhl/svg/MTL_light.svg',
  'Canes': 'https://assets.nhle.com/logos/nhl/svg/CAR_light.svg',
  'Devils': 'https://assets.nhle.com/logos/nhl/svg/NJD_light.svg'
};

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
    
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    
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
  let winnerHTML = '';
  if (winner) {
    const logoPath = teamLogos[winner] || null;
    winnerHTML = `
      <div class="winner">
        <div class="trophy">🏆</div>
        ${logoPath ? `<div class="logo-container"><img src="${logoPath}" alt="${winner} logo" class="team-logo"></div>` : ''}
        <div class="winner-name">${winner}</div>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>NHL Playoff Bracket</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background: #0a2351; /* Dark blue background */
      color: white;
      padding: 0;
      margin: 0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .page-container {
      padding: 40px 20px;
    }
    .bracket-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1100px;
      margin: 0 auto;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 15px;
      padding: 30px;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    }
    .conference {
      width: 45%;
      display: flex;
      flex-direction: column;
    }
    .conference-title {
      text-align: center;
      color: #4a9bff;
      margin-bottom: 20px;
      font-size: 24px;
      font-weight: bold;
      border-bottom: 2px solid #4a9bff;
      padding-bottom: 8px;
    }
    .bracket {
      display: flex;
      justify-content: space-between;
      flex-grow: 1;
      height: 500px; /* Fixed height for the bracket */
    }
    .round {
      display: flex;
      flex-direction: column;
      width: 23%;
      position: relative;
      height: 100%;
    }
    .round-title {
      font-weight: bold;
      text-align: center;
      margin-bottom: 12px;
      color: #d4e5ff;
    }
    .matchups {
      display: flex;
      flex-direction: column;
      justify-content: space-around; /* Evenly distribute matchups */
      height: calc(100% - 40px); /* Adjust for round title height */
      padding: 10px 0;
    }
    .matchup {
      background: rgba(255, 255, 255, 0.1);
      padding: 12px;
      border-radius: 6px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      font-size: 14px;
      border-left: 3px solid #4a9bff;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .team {
      padding: 5px 0;
      font-weight: bold;
      width: 100%;
    }
    .east-round .matchup {
      border-left: none;
      border-right: 3px solid #4a9bff;
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
      background: linear-gradient(to bottom, #ffd700, #e6c200);
      color: #333;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      font-weight: bold;
      font-size: 18px;
      text-align: center;
      margin-top: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .trophy {
      font-size: 60px;
      margin-bottom: 10px;
      text-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    }
    .logo-container {
      width: 80px;
      height: 80px;
      margin: 5px 0 10px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .team-logo {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    .winner-name {
      font-size: 25px;
      font-weight: bold;
    }
    h1 {
      text-align: center;
      color: white;
      margin-bottom: 30px;
      font-size: 36px;
      text-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    }
    .vs {
      color: #ffd700;
      font-weight: normal;
      font-style: italic;
      margin: 8px 0;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="page-container">
    <h1>🏒 NHL Playoff Bracket 🏒</h1>
    <div class="bracket-container">
      <div class="conference">
        <div class="conference-title">Western Conference</div>
        <div class="bracket">
          <div class="round west-round"><div class="round-title">Matchups</div><div class="matchups">${generateVerticalMatchupsFromPairs(westM)}</div></div>
          <div class="round west-round"><div class="round-title">Round 1</div><div class="matchups">${generateVerticalMatchups(westR1)}</div></div>
          <div class="round west-round"><div class="round-title">Round 2</div><div class="matchups">${generateVerticalMatchups(westR2)}</div></div>
          <div class="round west-round"><div class="round-title">Conference Final</div><div class="matchups">${generateVerticalMatchups(westR3)}</div></div>
        </div>
      </div>

      <div class="final-round">
        <div class="round-title">Stanley Cup Final</div>
        ${winnerHTML}
      </div>

      <div class="conference">
        <div class="conference-title">Eastern Conference</div>
        <div class="bracket" style="flex-direction: row-reverse;">
          <div class="round east-round"><div class="round-title">Matchups</div><div class="matchups">${generateVerticalMatchupsFromPairs(eastM)}</div></div>
          <div class="round east-round"><div class="round-title">Round 1</div><div class="matchups">${generateVerticalMatchups(eastR1)}</div></div>
          <div class="round east-round"><div class="round-title">Round 2</div><div class="matchups">${generateVerticalMatchups(eastR2)}</div></div>
          <div class="round east-round"><div class="round-title">Conference Final</div><div class="matchups">${generateVerticalMatchups(eastR3)}</div></div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function generateVerticalMatchups(teams) {
  let html = '';
  for (let i = 0; i < teams.length; i += 2) {
    if (teams[i + 1]) {
      html += `
        <div class="matchup">
          <span class="team">${teams[i]}</span>
          <span class="vs">vs</span>
          <span class="team">${teams[i + 1]}</span>
        </div>`;
    } else {
      html += `
        <div class="matchup">
          <span class="team">${teams[i]}</span>
        </div>`;
    }
  }
  return html;
}

function generateVerticalMatchupsFromPairs(pairs) {
  return pairs.map(([a, b]) => `
    <div class="matchup">
      <span class="team">${a}</span>
      <span class="vs">vs</span>
      <span class="team">${b}</span>
    </div>`).join('');
}

module.exports = generateBracketImage;