import { z } from "zod";

/**
 * Partial schema for the SignalR UPDATE_DIVISION payload.
 * We only document the parts we actually use.
 */
export const SignalRDivisionSchema = z.object({
  _Name: z.string().optional().describe("Internal name of the division"),
  id: z.number().describe("Internal division ID"),
  teams: z.array(z.object({
    id: z.number(),
    name: z.string(),
  })).describe("Full list of teams in this division"),
  days: z.array(z.object({
    number: z.number(),
    name: z.string(),
    date: z.string().describe("ISO date string YYYY-MM-DD"),
    flights: z.array(z.object({
      pools: z.array(z.object({
        number: z.number().describe("The pool number (maps to props)"),
        teams: z.array(z.object({
          teamId: z.number(),
        })),
      })).optional(),
    })).optional(),
  })).describe("Weekly schedule slots"),
  props: z.array(z.string()).optional().describe("Special property strings containing court mappings"),
}).passthrough(); // Allow unknown properties since the payload is huge

export const SignalRUpdateSchema = z.object({
  target: z.literal("StoreMutation"),
  arguments: z.tuple([
    z.literal("UPDATE_DIVISION"),
    SignalRDivisionSchema
  ]),
});
