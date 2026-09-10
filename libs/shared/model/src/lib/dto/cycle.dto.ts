/**
 * A cycle as stored: only what is observed. Length, end and temperature shift are conclusions and
 * are derived on read (`CycleWithDerived`) — a stored conclusion goes stale when an entry or a
 * start date is corrected, and nothing detects that it has.
 */
export type CycleDto = {
  cycleNumber?: number;
  startDate: Date;
  bleedingLength: number;
};

export type Cycle = CycleDto & {
  uuid: string;
  measurements?: Array<{
    uuid: string;
    date: Date;
    temperature?: number;
  }>;
};

/**
 * A cycle plus what follows from its neighbours. A cycle runs until the next one begins; the open
 * cycle has no end and no length, reported as `null` rather than zero.
 */
export type CycleWithDerived = Cycle & {
  isOpen: boolean;
  endDate: Date | null;
  length: number | null;
};
