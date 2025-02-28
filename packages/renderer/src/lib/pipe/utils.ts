// Utils for Backoff
// /Users/matthewsimon/Documents/Github/solomon-electron/next/src/lib/pipe/utils.ts

export function splitTextByRegex(text: string, regex: RegExp): string[] {
  if (!text) {
    console.warn("splitTextByRegex: No text provided");
    return [];
  }
  try {
    const split = text.split(regex);
    return split.filter(Boolean);
  } catch (e) {
    console.error("Error in splitTextByRegex:", e);
    return [];
  }
}

export function isHeading(text: string): boolean {
  if (!text) return false;
  try {
    // Heuristic: matches markdown headings (e.g. "# Heading") or lines in ALL CAPS (at least 5 chars)
    return /^(\s*#+\s*.+)$/.test(text) || /^[A-Z\s]{5,}$/.test(text);
  } catch (e) {
    console.error("Error in isHeading:", e);
    return false;
  }
}

/**
 * Retries an async function with exponential backoff and jitter.
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number,
  delay: number
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    const jitter = Math.floor(Math.random() * 100);
    const totalDelay = delay + jitter;
    console.warn(`Operation failed. Retrying in ${totalDelay}ms... (Retries left: ${retries - 1})`);
    await new Promise(res => setTimeout(res, totalDelay));
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
}