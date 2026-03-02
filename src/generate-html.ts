import fs from 'fs';
import path from 'path';

const publicDir = path.resolve('public');
const calendarsDir = path.resolve('public/calendars');

// Find all .ics files
const files = fs.readdirSync(calendarsDir).filter(f => f.endsWith('.ics'));

const listItems = files.map(file => {
  const teamName = file.replace('.ics', '').replace(/-/g, ' ');
  const url = `calendars/${file}`;
  const colors = ['#FFD700', '#FF69B4', '#00FFFF', '#ADFF2F', '#FF4500'];
  const bgColor = colors[Math.floor(Math.random() * colors.length)];
  
  return `
    <li style="background: ${bgColor};">
      <div class="team-name">${teamName.toUpperCase()}</div>
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
        }
        p { font-size: 1.5rem; font-weight: bold; margin-bottom: 30px; }
        ul { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 30px; }
        li { 
            border: 4px solid #000; 
            padding: 25px; 
            box-shadow: 10px 10px 0px #000;
            transition: transform 0.1s;
        }
        li:hover { transform: translate(-2px, -2px); box-shadow: 12px 12px 0px #000; }
        .team-name { font-size: 1.8rem; margin-bottom: 20px; border-bottom: 4px solid #000; padding-bottom: 10px; }
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
        ${listItems}
    </ul>
    <small>LAST UPDATED: ${new Date().toLocaleString().toUpperCase()}</small>
</body>
</html>
`;

fs.writeFileSync(path.join(publicDir, 'index.html'), html);
console.log(`Generated public/index.html with ${files.length} calendar links.`);
