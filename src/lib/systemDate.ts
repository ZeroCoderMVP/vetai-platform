/**
 * Utility to get the current system date.
 * If VETAI_DEMO_DATE is set in the environment (e.g. "2026-03-05"), it returns that date instead of the real current date.
 * This is crucial for demonstrating the system on historical data subsets without the UI looking "empty" on the actual present day.
 */
export function getSystemDate(): Date {
  const demoDateStr = process.env.VETAI_DEMO_DATE;
  if (demoDateStr) {
    const parsed = new Date(demoDateStr);
    if (!isNaN(parsed.getTime())) {
      // Return a date aligned to the demo date, but we can keep the local time portion neutral 
      // or just return the pure parsed date. For daily analytics, midnight or midday is fine.
      return parsed;
    }
  }
  return new Date();
}
