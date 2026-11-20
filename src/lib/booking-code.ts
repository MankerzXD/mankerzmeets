import crypto from "crypto";

/**
 * Generates a human-friendly short booking code, e.g. "MK-4892"
 */
export function generateBookingCode(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // exclude easily confused chars like 0, 1, I, O
  let randomPart = "";
  for (let i = 0; i < 4; i++) {
    const idx = crypto.randomInt(0, chars.length);
    randomPart += chars[idx];
  }
  return `MK-${randomPart}`;
}

/**
 * Generates a high-entropy URL-safe token for 1-click management links
 */
export function generateBookingToken(): string {
  return crypto.randomBytes(20).toString("hex");
}
