export enum BleedingOption {
  /** Recorded with dots rather than dashes on the paper sheet (workbook p. 15). */
  Spotting = 'Spotting',
  Light = 'Light',
  Medium = 'Medium',
  Heavy = 'Heavy',
}

export enum PainOption {
  Breasts = 'Breasts',
  Abdomen = 'Abdomen',
}

export enum MucusFeelingOption {
  Dry = 'Dry',
  None = 'None',
  Moist = 'Moist',
  Wet = 'Wet',
}

export enum MucusAppearanceOption {
  None = 'None',
  Sticky = 'Sticky',
  Creamy = 'Creamy',
  Transparent = 'Transparent',
  EggWhite = 'Egg-White',
}

export enum CervixPositionOption {
  Low = 'Low',
  Middle = 'Middle',
  High = 'High',
}

/** The sheet's "Lega + odprtost" row: how open the cervix is (`#R-CERVIX-01`). */
export enum CervixOpennessOption {
  Closed = 'Closed',
  MediumOpened = 'Medium opened',
  FullyOpened = 'Fully opened',
}

/**
 * The sheet's own "Čvrstost" row, recorded as *čvrst* / *mehak* (Slika 7).
 *
 * Separate from openness on purpose: `R-CERVIX-01` begins the post-ovulatory infertile phase on the
 * third day with a cervix that is closed **and firm**, so neither observation implies the other.
 */
export enum CervixFirmnessOption {
  Firm = 'Firm',
  Soft = 'Soft',
}

export enum IntercourseOption {
  Abstinence = 'Abstinence',
  Protected = 'Protected',
  Withdrawal = 'Withdrawal',
  Sex = 'Sex',
}

export enum NotesOption {
  Text = 'Text',
}
