const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * The only place a cycle day is computed. The cycle's start date is day 1.
 * Returns `null` when the date cannot be placed — a substituted default would not surface as an
 * error, it would surface as a wrong evaluation on a normal-looking chart.
 */
export const toCycleDay = (
  date: Date | string,
  cycleStartDate: Date | string | null | undefined
): number | null => {
  if (!cycleStartDate) return null;

  // Midnight, so a time-of-day difference or a daylight-saving transition cannot shift the count.
  const elapsedDays = Math.round(
    (atMidnight(date).getTime() - atMidnight(cycleStartDate).getTime()) /
      MILLISECONDS_PER_DAY
  );

  return elapsedDays < 0 ? null : elapsedDays + 1;
};

const atMidnight = (value: Date | string): Date => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

/**
 * A calendar day as `YYYY-MM-DD`, for every date-only field sent to the API.
 *
 * A `Date` serializes in UTC, which moves a local midnight east of Greenwich onto the previous day —
 * so a cycle picked to start on the 10th would be stored as starting on the 9th. Local date parts
 * are the day the user chose. A string is already the day the API returned.
 */
export const toCalendarDay = (value: Date | string): string => {
  if (typeof value === 'string') return value.slice(0, 10);
  return [value.getFullYear(), value.getMonth() + 1, value.getDate()]
    .map((part) => String(part).padStart(2, '0'))
    .join('-');
};
