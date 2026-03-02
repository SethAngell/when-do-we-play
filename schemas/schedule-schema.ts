import { z } from "zod";

export const GameEntrySchema = z.object({
  week: z.number().describe("The week number of the regular season"),
  date: z.string().describe("The formatted date string (e.g. 'Mar 2nd, 2026')"),
  courts: z.array(z.number()).describe("List of court numbers assigned for this game"),
  time: z.string().nullable().describe("The start time string (e.g. '6:15PM')"),
});

export const TeamScheduleSchema = z.object({
  team: z.string().describe("The name of the team"),
  schedule: z.array(GameEntrySchema).describe("List of scheduled games for the team"),
});

export const FullScheduleSchema = z.array(TeamScheduleSchema);
