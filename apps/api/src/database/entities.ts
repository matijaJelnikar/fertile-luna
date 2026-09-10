import { Cycle } from '../entities/cycle.entity';
import { Measurement } from '../entities/measurement.entity';
import { User } from '../entities/user.entity';

/** The entity list, in one place, so the running app and the migration CLI cannot disagree. */
export const entities = [User, Cycle, Measurement];
