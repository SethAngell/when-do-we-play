import { z } from "zod";

export const TeamConfigSchema = z.object({
  league: z.string().describe("The full name of the league as it appears on the website search"),
  division: z.string().describe("The specific division name (e.g. 'Monday Fours')"),
  teamName: z.string().describe("The exact name of the team to track"),
});

export const HydratedTeamSchema = TeamConfigSchema.extend({
  eventId: z.string().describe("The internal unique ID for the league event"),
  divisionId: z.string().describe("The internal unique ID for the specific division"),
});

export const TeamListSchema = z.array(TeamConfigSchema);
export const HydratedTeamListSchema = z.array(HydratedTeamSchema);
