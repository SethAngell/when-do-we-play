import { test } from "@playwright/test";
import fs from "fs";
import path from "path";
import { RegistrationSchema } from "../schemas/registration-schema";
import { HydratedTeamSchema } from "../schemas/team-schema";

/**
 * Register a team by discovering its IDs.
 * Inputs (via ENV): LEAGUE_NAME, DIVISION_NAME, TEAM_NAME
 */
test("Register and Discover Team", async ({ page }) => {
  const registrationRequest = RegistrationSchema.parse({
    leagueName: process.env.LEAGUE_NAME,
    divisionName: process.env.DIVISION_NAME,
    teamName: process.env.TEAM_NAME,
  });

  if (!registrationRequest.leagueName || !registrationRequest.teamName) {
    throw new Error(
      "LEAGUE_NAME and TEAM_NAME environment variables are required.",
    );
  }

  const dataDir = path.join(process.cwd(), "data");
  const teamsPath = path.join(dataDir, "teams-hydrated.json");

  console.log(`Working Directory: ${process.cwd()}`);
  console.log(`Target Data Directory: ${dataDir}`);
  console.log(`Target File Path: ${teamsPath}`);

  // Ensure the directory exists
  if (!fs.existsSync(dataDir)) {
    console.log("Creating data directory...");
    fs.mkdirSync(dataDir, { recursive: true });
  }

  console.log(
    `Discovering IDs for: ${registrationRequest.leagueName} - ${registrationRequest.divisionName}`,
  );

  await page.goto("https://captnbills.volleyballlife.com/events");

  // Handle "continue to site" modal
  try {
    const continueBtn = page.getByRole("button", { name: /continue to site/i });
    if (await continueBtn.isVisible({ timeout: 5000 })) {
      await continueBtn.click();
      await page.waitForTimeout(1000);
    }
  } catch (e) {}

  // Search for the league
  await page
    .getByRole("textbox", { name: /Search Tournaments/i })
    .fill(registrationRequest.leagueName);

  // Extract Event ID
  const eventLink = page
    .locator("a")
    .filter({ hasText: /View Event/i })
    .first();
  await eventLink.waitFor({ state: "visible" });
  const eventHref = await eventLink.getAttribute("href");
  const eventId = eventHref?.match(/event\/(\d+)/)?.[1];

  if (!eventId)
    throw new Error(
      `Could not find event ID for ${registrationRequest.leagueName}`,
    );
  await eventLink.click();

  // Extract Division ID
  let divisionId: string | undefined;
  if (registrationRequest.divisionName) {
    const divOption = page
      .getByRole("option", { name: registrationRequest.divisionName })
      .first();
    await divOption.waitFor({ state: "visible" });
    await divOption.click({ force: true });

    await page.waitForTimeout(2000);
    const divLink = page.locator(`a[href*="division/"]`).first();
    const divHref = await divLink.getAttribute("href");
    divisionId = divHref?.match(/division\/(\d+)/)?.[1];
  }

  if (!divisionId)
    throw new Error(
      `Could not find division ID for ${registrationRequest.divisionName}`,
    );

  const newTeam = HydratedTeamSchema.parse({
    league: registrationRequest.leagueName,
    division: registrationRequest.divisionName || "",
    teamName: registrationRequest.teamName,
    eventId,
    divisionId: divisionId || "",
  });

  // Append to hydrated list
  let teams = [];
  if (fs.existsSync(teamsPath)) {
    try {
      teams = JSON.parse(fs.readFileSync(teamsPath, "utf-8"));
    } catch (e) {
      console.error(
        "Error reading existing hydrated teams file, starting fresh.",
      );
    }
  }

  // Update or Add
  const index = teams.findIndex(
    (t: any) =>
      t.teamName === registrationRequest.teamName &&
      t.league === registrationRequest.leagueName,
  );
  if (index !== -1) {
    teams[index] = newTeam;
    console.log(`Updated existing team: ${registrationRequest.teamName}`);
  } else {
    teams.push(newTeam);
    console.log(`Added new team: ${registrationRequest.teamName}`);
  }

  console.log(`Writing to: ${teamsPath}`);
  fs.writeFileSync(teamsPath, JSON.stringify(teams, null, 2));
  console.log(
    `Successfully registered ${registrationRequest.teamName} with Event ${eventId} and Division ${divisionId}`,
  );
});
