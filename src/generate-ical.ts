import ical, { ICalCalendarMethod } from 'ical-generator';
import fs from 'fs';
import path from 'path';
import { FullScheduleSchema } from '../schemas/schedule-schema';

/**
 * Utility to parse strings like "Mar 2nd, 2026" and "6:15PM" into a Date object.
 */
function parseDateTime(dateStr: string, timeStr: string): Date {
  const cleanDate = dateStr.replace(/(st|nd|rd|th),/g, '');
  const cleanTime = timeStr.replace(/([APM]+)$/i, ' $1');
  const combined = `${cleanDate} ${cleanTime}`;
  return new Date(combined);
}

const dataDir = path.resolve('data');
const publicDir = path.resolve('public/calendars');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const files = fs.readdirSync(dataDir).filter(f => f.startsWith('schedule-') && f.endsWith('.json'));

for (const file of files) {
  const filePath = path.join(dataDir, file);
  const rawData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  // Validate data with Zod
  const result = FullScheduleSchema.safeParse(rawData);
  if (!result.success) {
    console.log(`Skipping ${file} - invalid format:`, result.error.format());
    continue;
  }

  const teamData = result.data[0];
  const teamName = teamData.team;
  const normalizedTeam = teamName.replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9-]/g, '');
  
  console.log(`Generating iCal for ${teamName}...`);
  
  const calendar = ical({ name: `Volleyball: ${teamName}` });
  calendar.method(ICalCalendarMethod.PUBLISH);

  for (const entry of teamData.schedule) {
    if (!entry.time || entry.time === "Unknown") continue;

    const start = parseDateTime(entry.date, entry.time);
    const end = new Date(start.getTime() + (1 * 60 + 50) * 60 * 1000);

    // CONSISTENT UID logic: 
    // Format: volleyball-<team>-week-<week>
    // This ensures that even if date/time changes, the calendar app updates the existing event.
    const uid = `volleyball-${normalizedTeam}-week-${entry.week}`;

    calendar.createEvent({
      id: uid,
      start,
      end,
      summary: `Volleyball (Courts ${entry.courts.join(' & ')})`,
      location: `4240 Market St, Wilmington, NC 28403`,
      description: `Team: ${teamName} | Week ${entry.week} of regular season.`,
      url: 'https://captnbills.volleyballlife.com/'
    });
  }

  const outPath = path.join(publicDir, `${normalizedTeam}.ics`);
  fs.writeFileSync(outPath, calendar.toString());
  console.log(`  Saved to ${outPath}`);
}
