import { CycleDto } from '@basal-temp-log-workspace/model';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Request DTO for `POST /api/cycle/add`.
 *
 * The shared `CycleDto` is a type and carries no runtime metadata, so the global ValidationPipe
 * has nothing to whitelist against. Implementing it here keeps the contract in one place while
 * making it enforceable.
 */
export class CreateCycleRequestDto implements CycleDto {
  @ApiProperty({ example: 1, required: false, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  cycleNumber?: number;

  @ApiProperty({ example: '2026-01-13', type: String, format: 'date' })
  @Type(() => Date)
  @IsDate()
  startDate!: Date;

  @ApiProperty({ example: 5, minimum: 0, maximum: 31 })
  @IsInt()
  @Min(0)
  @Max(31)
  bleedingLength!: number;
}
