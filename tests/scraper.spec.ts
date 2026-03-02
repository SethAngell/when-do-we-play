import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { HydratedTeamListSchema } from "../schemas/team-schema";
import { SignalRUpdateSchema } from "../schemas/signalr-schema";

const teamsPath = path.resolve("data", "teams-hydrated.json");

/**
 * Robust extractor using SignalR payloads.
 */
test("Extract schedules via SignalR", async ({ page }) => {
  if (!fs.existsSync(teamsPath)) {
    console.log("No hydrated teams found. Skipping extraction.");
    return;
  }

  const rawTeams = JSON.parse(fs.readFileSync(teamsPath, "utf-8"));
  const teams = HydratedTeamListSchema.parse(rawTeams);

  for (const team of teams) {
    test.setTimeout(60000);
    console.log(`\n--- Processing ${team.teamName} ---`);
    
    let capturedDivision: any = null;

    page.on('websocket', (ws) => {
      ws.on('framereceived', (v) => {
        const payload = v.payload.toString();
        if (payload.includes('UPDATE_DIVISION')) {
          try {
            const clean = payload.replace(/\u001e/g, '');
            const parsed = JSON.parse(clean);
            
            // Validate SignalR payload
            const result = SignalRUpdateSchema.safeParse(parsed);
            if (result.success) {
              capturedDivision = result.data.arguments[1];
            }
          } catch (e) {}
        }
      });
    });

    await page.goto(`https://captnbills.volleyballlife.com/event/${team.eventId}/division/${team.divisionId}/regular_season`);

    // Wait for SignalR data
    for (let i = 0; i < 20; i++) {
      if (capturedDivision && capturedDivision.days) break;
      await page.waitForTimeout(1000);
    }

    if (!capturedDivision) {
      console.error(`Failed to capture data for ${team.teamName}`);
      continue;
    }

    // 1. Find Team ID
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const targetNormalized = normalize(team.teamName);
    const teamInfo = capturedDivision.teams.find((t: any) => normalize(t.name) === targetNormalized);

    if (!teamInfo) {
      console.error(`Team ${team.teamName} not found in division`);
      continue;
    }

    // 2. Parse Pool Mappings via Deep Search
    const poolMap = new Map<string, string>(); 
    const findPoolProps = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      if (Array.isArray(obj)) {
        obj.forEach(item => {
          if (typeof item === 'string' && item.startsWith('pool-')) {
            const match = item.match(/pool-(\d+)-slot-(\d+)~court-(.+)/i) || 
                          item.match(/pool-(\d+)-slot-(\d+)-(.*)/i);
            if (match) {
              poolMap.set(`pool-${match[1]}-slot-${match[2]}`, match[3].replace('court-', ''));
            }
          } else {
            findPoolProps(item);
          }
        });
      } else {
        Object.values(obj).forEach(value => findPoolProps(value));
      }
    };
    findPoolProps(capturedDivision);

    // 3. Map Schedules
    const scheduleEntries = [];
    for (const day of capturedDivision.days) {
      let matchFound = false;
      if (day.flights) {
        for (const flight of day.flights) {
          if (flight.pools) {
            for (const pool of flight.pools) {
              if (pool.teams.some((t: any) => t.teamId === teamInfo.id)) {
                let assignedCourts = "";
                let assignedTime = "";
                
                for (let slot = 0; slot <= 1; slot++) {
                  const key = `pool-${pool.number}-slot-${slot}`;
                  if (poolMap.has(key)) {
                    assignedCourts = poolMap.get(key) || "";
                    assignedTime = slot === 0 ? "6:15PM" : "8:45PM";
                    break;
                  }
                }

                const d = new Date(day.date + 'T12:00:00Z');
                const month = d.toLocaleString('en-US', { month: 'short' });
                const dayNum = d.getUTCDate();
                const suffix = (n: number) => [,'st','nd','rd'][n%100>>3^1&&n%10]||'th';
                const formattedDate = `${month} ${dayNum}${suffix(dayNum)}, ${d.getUTCFullYear()}`;

                scheduleEntries.push({
                  week: day.number,
                  date: formattedDate,
                  courts: assignedCourts.match(/\d+/g)?.map(Number) || [],
                  time: assignedTime
                });
                matchFound = true;
                break;
              }
            }
          }
          if (matchFound) break;
        }
      }
    }

    const output = [{ team: team.teamName, schedule: scheduleEntries }];
    const fileName = `schedule-${normalize(team.teamName)}.json`;
    fs.writeFileSync(path.resolve('data', fileName), JSON.stringify(output, null, 2));
    console.log(`Saved ${scheduleEntries.length} games to ${fileName}`);
  }
});
