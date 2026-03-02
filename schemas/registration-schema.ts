import z from "zod";

export const RegistrationSchema = z.object({
  leagueName: z.string(),
  divisionName: z.string(),
  teamName: z.string(),
});
