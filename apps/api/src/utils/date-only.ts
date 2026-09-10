/**
 * Renders a value as the `YYYY-MM-DD` a Postgres `date` column holds. TypeORM writes such a column
 * from local calendar parts and reads it back as a string, so comparisons must go through the same
 * parts or a day either side of midnight matches the wrong row.
 */
export const toDateOnly = (value: Date | string): string => {
  if (typeof value === 'string') {
    const asStoredDay = /^\d{4}-\d{2}-\d{2}/.exec(value);
    if (asStoredDay) return asStoredDay[0];
  }

  const date = typeof value === 'string' ? new Date(value) : value;
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${date.getFullYear()}-${month}-${day}`;
};
