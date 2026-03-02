import fs from 'fs';
import path from 'path';

const publicDir = path.resolve('public');
const calendarsDir = path.resolve('public/calendars');

// Find all .ics files
const files = fs.readdirSync(calendarsDir).filter(f => f.endsWith('.ics'));

const listItems = files.map(file => {
  const teamName = file.replace('.ics', '').replace(/-/g, ' ');
  const url = `calendars/${file}`;
  return `
    <li>
      <strong>${teamName.toUpperCase()}</strong>: 
      <a href="${url}">Download .ics</a> | 
      <code>https://<user>.github.io/when-do-we-play/${url}</code>
    </li>`;
}).join('');

const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Volleyball Schedules</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; background: #f4f4f9; }
        h1 { color: #333; border-bottom: 2px solid #ccc; padding-bottom: 10px; }
        ul { list-style: none; padding: 0; }
        li { background: #fff; margin-bottom: 10px; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        code { background: #eee; padding: 2px 5px; border-radius: 4px; font-size: 0.9em; display: block; margin-top: 10px; word-break: break-all; }
        a { color: #007bff; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <h1>Volleyball Subscription Feeds</h1>
    <p>Copy the link below to subscribe to your team's schedule in your calendar app (Google Calendar, iCal, etc.)</p>
    <ul>
        ${listItems}
    </ul>
    <p><small>Last updated: ${new Date().toLocaleString()}</small></p>
</body>
</html>
`;

fs.writeFileSync(path.join(publicDir, 'index.html'), html);
console.log(`Generated public/index.html with ${files.length} calendar links.`);
