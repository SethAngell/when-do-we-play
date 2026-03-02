import fs from 'fs';
import path from 'path';
import { HydratedTeamListSchema } from '../schemas/team-schema';

const teamsPath = path.resolve('data', 'teams-hydrated.json');

// 1. Read teams from the source of truth
let teams = [];
if (fs.existsSync(teamsPath)) {
  try {
    const raw = JSON.parse(fs.readFileSync(teamsPath, 'utf-8'));
    teams = HydratedTeamListSchema.parse(raw);
  } catch (e) {
    console.error("Failed to parse teams for HTML generation:", e);
  }
}

// 2. Generate cards dynamically
const listItems = teams.map(team => {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const icsFilename = `${normalize(team.teamName)}.ics`;
  const url = `public/calendars/${icsFilename}`;
  
  const colors = ['#FFD700', '#FF69B4', '#00FFFF', '#ADFF2F', '#FF4500'];
  // Use a hash of the team name to keep colors stable per team
  const colorIndex = team.teamName.length % colors.length;
  const bgColor = colors[colorIndex];
  
  return `
    <li style="background: ${bgColor};">
      <div class="team-name">${team.teamName.toUpperCase()}</div>
      <div class="league-info">${team.league}</div>
      <a class="btn" href="${url}">DOWNLOAD .ICS</a>
      <div class="url-box">
        <code>https://SethAngell.github.io/when-do-we-play/${url}</code>
      </div>
    </li>`;
}).join('');

const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VOLLEYBALL SCHEDULES</title>
    <style>
        * { box-sizing: border-box; }
        body { 
            font-family: "Arial Black", sans-serif; 
            line-height: 1.2; 
            padding: 40px 20px; 
            max-width: 900px; 
            margin: 0 auto; 
            background: #fff; 
            color: #000;
        }
        h1 { 
            font-size: 4rem; 
            text-transform: uppercase; 
            background: #FF69B4; 
            display: inline-block; 
            padding: 10px 20px; 
            border: 4px solid #000; 
            box-shadow: 8px 8px 0px #000;
            margin-bottom: 40px;
            max-width: 100%;
            word-wrap: break-word;
        }
        p { font-size: 1.5rem; font-weight: bold; margin-bottom: 30px; }
        ul { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 30px; }
        
        @media (max-width: 600px) {
            h1 { font-size: 2.5rem; }
            p { font-size: 1.2rem; }
            ul { grid-template-columns: 1fr; gap: 20px; }
            li { padding: 15px; }
            .team-name { font-size: 1.5rem; }
        }

        li { 
            border: 4px solid #000; 
            padding: 25px; 
            box-shadow: 10px 10px 0px #000;
            transition: transform 0.1s;
            display: flex;
            flex-direction: column;
        }
        li:hover { transform: translate(-2px, -2px); box-shadow: 12px 12px 0px #000; }
        
        .team-name { font-size: 1.8rem; margin-bottom: 5px; border-bottom: 4px solid #000; padding-bottom: 10px; }
        .league-info { font-size: 0.9rem; margin-bottom: 20px; font-weight: bold; opacity: 0.8; }
        
        .btn { 
            display: block; 
            background: #000; 
            color: #fff; 
            text-align: center; 
            padding: 15px; 
            text-decoration: none; 
            font-size: 1.2rem; 
            border: 4px solid #000;
            margin-bottom: 15px;
            margin-top: auto;
        }
        .btn:hover { background: #fff; color: #000; }
        .url-box { background: #fff; border: 2px solid #000; padding: 10px; }
        code { font-family: monospace; font-size: 0.8em; word-break: break-all; }
        small { display: block; margin-top: 50px; font-weight: bold; text-transform: uppercase; }
    </style>
</head>
<body>
    <h1>VOLLEYBALL FEEDS</h1>
    <p>SUBSCRIBE TO YOUR TEAM'S SCHEDULE. COPY THE LINK BELOW INTO GOOGLE CALENDAR OR ICAL.</p>
    <ul>
        ${listItems || '<li>NO TEAMS REGISTERED YET</li>'}
    </ul>
    <small>LAST UPDATED: ${new Date().toLocaleString().toUpperCase()}</small>
</body>
</html>
`;

fs.writeFileSync(path.resolve('index.html'), html);
console.log(`Generated root index.html with ${teams.length} team cards.`);
