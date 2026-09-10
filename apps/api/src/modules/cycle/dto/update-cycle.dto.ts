import { PartialType } from '@nestjs/swagger';
import { CreateCycleRequestDto } from './create-cycle.dto';

/**
 * Request DTO for `PUT /api/cycle/update/:cycleUuid`. Every field of the create contract, each
 * optional; the constraints and Swagger metadata come with them.
 */
export class UpdateCycleRequestDto extends PartialType(CreateCycleRequestDto) {}
