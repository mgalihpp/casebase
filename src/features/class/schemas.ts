import { z } from "zod";

export const classCodeSchema = z
  .string()
  .trim()
  .min(1, "Masukkan kode kelas.")
  .max(20, "Kode kelas terlalu panjang.")
  .transform((code) => code.toUpperCase());

export const lookupInput = z.object({ code: classCodeSchema });
export const joinInput = z.object({ code: classCodeSchema });
