import {
  BleedingOption,
  CervixFeelingOption,
  CervixPositionOption,
  DisturbanceReason,
  IntercourseOption,
  MeasurementDto,
  MucusAppearanceOption,
  MucusFeelingOption,
  PainOption,
} from '@basal-temp-log-workspace/model';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

/**
 * Request DTO for `POST /api/measurement/add/:cycleId`.
 *
 * The shared `MeasurementDto` is a type, so the global ValidationPipe cannot whitelist against
 * it. Every observation is optional, the temperature included: a day may record only a mucus
 * observation. Omitted fields are simply absent — clearing a recorded value goes through the
 * update endpoint's `null`.
 */
export class CreateMeasurementRequestDto implements MeasurementDto {
  @ApiProperty({ example: '2026-01-13', type: String, format: 'date' })
  @Type(() => Date)
  @IsDate()
  date!: Date;

  @ApiProperty({ required: false, example: 36.6, minimum: 30, maximum: 45 })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(45)
  temperature?: number;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  disturbed?: boolean;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  disturbanceReasons?: DisturbanceReason[];

  @ApiProperty({ required: false, enum: BleedingOption })
  @IsOptional()
  @IsEnum(BleedingOption)
  bleeding?: BleedingOption;

  @ApiProperty({ required: false, enum: PainOption })
  @IsOptional()
  @IsEnum(PainOption)
  pain?: PainOption;

  @ApiProperty({ required: false, enum: MucusFeelingOption })
  @IsOptional()
  @IsEnum(MucusFeelingOption)
  mucusFeeling?: MucusFeelingOption;

  @ApiProperty({ required: false, enum: MucusAppearanceOption })
  @IsOptional()
  @IsEnum(MucusAppearanceOption)
  mucusAppearance?: MucusAppearanceOption;

  @ApiProperty({ required: false, enum: CervixPositionOption })
  @IsOptional()
  @IsEnum(CervixPositionOption)
  cervixPosition?: CervixPositionOption;

  @ApiProperty({ required: false, enum: CervixFeelingOption })
  @IsOptional()
  @IsEnum(CervixFeelingOption)
  cervixFeeling?: CervixFeelingOption;

  @ApiProperty({ required: false, enum: IntercourseOption })
  @IsOptional()
  @IsEnum(IntercourseOption)
  intercourse?: IntercourseOption;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
