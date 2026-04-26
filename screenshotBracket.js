const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const westernTeams = ['Avs', 'Stars', 'Wild', 'Mammoth', 'Vegas', 'Oilers', 'Ducks', 'Kings'];
const easternTeams = ['Sabres', 'Tampa', 'Habs', 'Bruins', 'Canes', 'Pens', 'Flyers', 'Sens'];

const eliminated = ['Sens'];
const round1Winners = ['Canes'];
const round2Winners = [];
const round3Winners = [];
const finalWinner = '';

const teamLogos = {
  'Mammoth': 'https://assets.nhle.com/logos/nhl/svg/UTA_light.svg',
  'Ducks': 'https://assets.nhle.com/logos/nhl/svg/ANA_light.svg',
  'Stars': 'https://assets.nhle.com/logos/nhl/svg/DAL_light.svg',
  'Avs': 'https://assets.nhle.com/logos/nhl/svg/COL_light.svg',
  'Vegas': 'https://assets.nhle.com/logos/nhl/svg/VGK_light.svg',
  'Wild': 'https://assets.nhle.com/logos/nhl/svg/MIN_light.svg',
  'Kings': 'https://assets.nhle.com/logos/nhl/svg/LAK_light.svg',
  'Oilers': 'https://assets.nhle.com/logos/nhl/svg/EDM_light.svg',
  'Sabres': 'https://assets.nhle.com/logos/nhl/svg/BUF_light.svg',
  'Sens': 'https://assets.nhle.com/logos/nhl/svg/OTT_light.svg',
  'Tampa': 'https://assets.nhle.com/logos/nhl/svg/TBL_light.svg',
  'Bruins': 'https://assets.nhle.com/logos/nhl/svg/BOS_light.svg',
  'Flyers': 'https://assets.nhle.com/logos/nhl/svg/PHI_light.svg',
  'Habs': 'https://assets.nhle.com/logos/nhl/svg/MTL_light.svg',
  'Canes': 'https://assets.nhle.com/logos/nhl/svg/CAR_light.svg',
  'Pens': 'https://assets.nhle.com/logos/nhl/svg/PIT_light.svg'
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
    predictions.round4,
    predictions
  );

  fs.writeFileSync(htmlPath, htmlContent);
  const fileUrl = `file://${htmlPath.replace(/\\/g, '/')}`;

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process',
      '--no-zygote',
    ],
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

function getTeamStatusForRound(team, round) {

  if (round === 1) {
    if (round1Winners.length === 0) return '';
    if (round1Winners.includes(team)) return 'active';
    if (eliminated.includes(team)) return 'eliminated';
    return '';
  }

  if (round === 2) {
    if (round2Winners.length === 0) return '';
    if (round2Winners.includes(team)) return 'active';
    if (eliminated.includes(team)) return 'eliminated';
    return '';
  }

  if (round === 3) {
    if (round3Winners.length === 0) return '';
    if (round3Winners.includes(team)) return 'active';
    if (eliminated.includes(team)) return 'eliminated';
    return '';
  }

  if (round === 4) {
    if (!finalWinner) return '';
    if (finalWinner.includes(team)) return 'active';
    if (eliminated.includes(team)) return 'eliminated';
    return '';
  }

  return '';
}

function generateHTML(westM, westR1, westR2, westR3, eastM, eastR1, eastR2, eastR3, winner, predictions) {
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
      background: #0a2351;
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
      height: 500px;
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
      justify-content: space-around;
      height: calc(100% - 40px);
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
    .matchup.correct {
      border-left: 3px solid #ffd700;
      box-shadow: 0 0 8px rgba(255, 215, 0, 0.6);
      background: rgba(255, 215, 0, 0.08);
    }
    .east-round .matchup.correct {
      border-left: none;
      border-right: 3px solid #ffd700;
    }
    .team {
      padding: 5px 0;
      font-weight: bold;
      width: 100%;
    }
    .team.eliminated {
      color: #ff4d4d;
      text-decoration: line-through;
      opacity: 0.8;
    }
    .team.active {
      color: #4dff4d;
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
    .legend {
      display: flex;
      justify-content: center;
      margin-top: 20px;
      color: white;
      font-size: 14px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      margin: 0 15px;
    }
    .legend-color {
      width: 12px;
      height: 12px;
      margin-right: 6px;
      border-radius: 2px;
    }
    .legend-eliminated {
      background-color: #ff4d4d;
    }
    .legend-active {
      background-color: #4dff4d;
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
          <div class="round west-round"><div class="round-title">Round 1</div><div class="matchups">${generateVerticalMatchupsFromPairs(westM, 1, predictions)}</div></div>
          <div class="round west-round"><div class="round-title">Round 2</div><div class="matchups">${generateVerticalMatchups(westR1, 2, predictions)}</div></div>
          <div class="round west-round"><div class="round-title">Conference Final</div><div class="matchups">${generateVerticalMatchups(westR2, 3, predictions)}</div></div>
          <div class="round west-round"><div class="round-title">Stanley Cup Final</div><div class="matchups">${generateVerticalMatchups(westR3, 4, predictions)}</div></div>
        </div>
      </div>

      <div class="final-round">
        <div class="round-title">Stanley Cup Winner</div>
        ${winnerHTML}
      </div>

      <div class="conference">
        <div class="conference-title">Eastern Conference</div>
        <div class="bracket" style="flex-direction: row-reverse;">
          <div class="round east-round"><div class="round-title">Round 1</div><div class="matchups">${generateVerticalMatchupsFromPairs(eastM, 1, predictions)}</div></div>
          <div class="round east-round"><div class="round-title">Round 2</div><div class="matchups">${generateVerticalMatchups(eastR1, 2, predictions)}</div></div>
          <div class="round east-round"><div class="round-title">Conference Final</div><div class="matchups">${generateVerticalMatchups(eastR2, 3, predictions)}</div></div>
          <div class="round east-round"><div class="round-title">Stanley Cup Final</div><div class="matchups">${generateVerticalMatchups(eastR3, 4, predictions)}</div></div>
        </div>
      </div>
    </div>
    <div class="legend">
      <div class="legend-item">
        <div class="legend-color legend-active"></div>
        <span>Advanced</span>
      </div>
      <div class="legend-item">
        <div class="legend-color legend-eliminated"></div>
        <span>Eliminated</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background-color:#ffd700;"></div>
        <span>Correct Pick</span>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function isCorrectPrediction(teamA, teamB, round, predictions) {
  const realWinners = {
    1: round1Winners,
    2: round2Winners,
    3: round3Winners,
    4: finalWinner ? [finalWinner] : [],
  }[round] || [];

  const userPicks = round === 4
    ? (predictions.round4 ? [predictions.round4] : [])
    : (predictions[`round${round}`] || []);

  
  const userPickForMatchup = userPicks.find(t => t === teamA || t === teamB);

  return userPickForMatchup && realWinners.includes(userPickForMatchup);
}

function generateVerticalMatchups(teams, round, predictions) {
  let html = '';
  for (let i = 0; i < teams.length; i += 2) {
    if (teams[i + 1]) {
      const correct = isCorrectPrediction(teams[i], teams[i + 1], round, predictions);
      html += `
        <div class="matchup${correct ? ' correct' : ''}">
          <span class="team ${getTeamStatusForRound(teams[i], round)}">${teams[i]}</span>
          <span class="vs">vs</span>
          <span class="team ${getTeamStatusForRound(teams[i + 1], round)}">${teams[i + 1]}</span>
        </div>`;
    } else {
      html += `
        <div class="matchup">
          <span class="team ${getTeamStatusForRound(teams[i], round)}">${teams[i]}</span>
        </div>`;
    }
  }
  return html;
}

function generateVerticalMatchupsFromPairs(pairs, round, predictions) {
  return pairs.map(([a, b]) => {
    const correct = isCorrectPrediction(a, b, round, predictions);
    return `
    <div class="matchup${correct ? ' correct' : ''}">
      <span class="team ${getTeamStatusForRound(a, round)}">${a}</span>
      <span class="vs">vs</span>
      <span class="team ${getTeamStatusForRound(b, round)}">${b}</span>
    </div>`;
  }).join('');
}

module.exports = generateBracketImage;