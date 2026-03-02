import { test } from "@playwright/test";
import fs from "fs";
import path from "path";

import { HydratedTeamSchema } from "../schemas/team-schema";

import { fileURLToPath } from 'url';

// Robust path resolution for CI
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const teamsPath = path.resolve(__dirname, "../data/teams-hydrated.json");

/**
 * Register a team by discovering its IDs.
 * Inputs (via ENV): LEAGUE_NAME, DIVISION_NAME, TEAM_NAME
 */
test("Register and Discover Team", async ({ page }) => {
  const leagueName = process.env.LEAGUE_NAME;
  const divisionName = process.env.DIVISION_NAME;
  const teamName = process.env.TEAM_NAME;

  if (!leagueName || !teamName) {
    throw new Error("LEAGUE_NAME and TEAM_NAME environment variables are required.");
  }

  // Ensure the directory exists before doing anything else
  const dir = path.dirname(teamsPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  console.log(`Discovering IDs for: ${leagueName} - ${divisionName}`);
  
  await page.goto("https://captnbills.volleyballlife.com/events");

  // Handle "continue to site" modal
  try {
    const continueBtn = page.getByRole('button', { name: /continue to site/i });
    if (await continueBtn.isVisible({ timeout: 5000 })) {
      await continueBtn.click();
      await page.waitForTimeout(1000);
    }
  } catch (e) {}

  // Search for the league
  await page.getByRole("textbox", { name: /Search Tournaments/i }).fill(leagueName);
  
  // Extract Event ID
  const eventLink = page.locator('a').filter({ hasText: /View Event/i }).first();
  await eventLink.waitFor({ state: 'visible' });
  const eventHref = await eventLink.getAttribute('href');
  const eventId = eventHref?.match(/event\/(\d+)/)?.[1];
  
  if (!eventId) throw new Error(`Could not find event ID for ${leagueName}`);
  await eventLink.click();

  // Extract Division ID
  let divisionId: string | undefined;
  if (divisionName) {
    const divOption = page.getByRole("option", { name: divisionName }).first();
    await divOption.waitFor({ state: 'visible' });
    await divOption.click({ force: true });
    
    await page.waitForTimeout(2000);
    const divLink = page.locator(`a[href*="division/"]`).first();
    const divHref = await divLink.getAttribute('href');
    divisionId = divHref?.match(/division\/(\d+)/)?.[1];
  }

  if (!divisionId) throw new Error(`Could not find division ID for ${divisionName}`);

  const newTeam = HydratedTeamSchema.parse({
    league: leagueName,
    division: divisionName || "",
    teamName: teamName,
    eventId,
    divisionId: divisionId || ""
  });

  // Append to hydrated list
  let teams = [];
  if (fs.existsSync(teamsPath)) {
    teams = JSON.parse(fs.readFileSync(teamsPath, "utf-8"));
  }
  
  // Update or Add
  const index = teams.findIndex((t: any) => t.teamName === teamName && t.league === leagueName);
  if (index !== -1) {
    teams[index] = newTeam;
    console.log(`Updated existing team: ${teamName}`);
  } else {
    teams.push(newTeam);
    console.log(`Added new team: ${teamName}`);
  }

  fs.writeFileSync(teamsPath, JSON.stringify(teams, null, 2));
  console.log(`Successfully registered ${teamName} with Event ${eventId} and Division ${divisionId}`);
});
