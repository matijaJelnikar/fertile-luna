export type CycleDto = {
  cycleNumber?: number;
  startDate: Date;
  bleedingLength: number;
  cycleLength?: number;
  firstHigherTemp?: number;
};

export type Cycle = CycleDto & {
  uuid: string;
  measurements?: Array<{
    uuid: string;
    date: Date;
    temperature: number;
  }>;
};
