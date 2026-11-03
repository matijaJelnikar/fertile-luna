/** What the user charts for; it only decides how the app colours a day's phase. */
export const CYCLE_GOALS = ['avoid', 'conceive'] as const;

export type CycleGoal = (typeof CYCLE_GOALS)[number];
