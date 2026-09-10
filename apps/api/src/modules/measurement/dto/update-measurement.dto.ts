import {
  BleedingOption,
  CervixFeelingOption,
  CervixPositionOption,
  IntercourseOption,
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
 * Request DTO for `PUT /api/measurement/:uuid`.
 *
 * The shared `UpdateMeasurementDto` type carries no runtime metadata, so the global
 * ValidationPipe cannot whitelist or validate against it. Every optional field accepts
 * `null` — that is how the client clears a previously recorded observation.
 */
export class UpdateMeasurementRequestDto {
  @ApiProperty({ required: false, type: Date })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  date?: Date;

  @ApiProperty({
    required: false,
    example: 36.6,
    nullable: true,
    minimum: 30,
    maximum: 45,
  })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(45)
  temperature?: number | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsBoolean()
  disturbed?: boolean | null;

  @ApiProperty({ required: false, type: [String], nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  disturbanceReasons?: string[] | null;

  @ApiProperty({ required: false, enum: BleedingOption, nullable: true })
  @IsOptional()
  @IsEnum(BleedingOption)
  bleeding?: BleedingOption | null;

  @ApiProperty({ required: false, enum: PainOption, nullable: true })
  @IsOptional()
  @IsEnum(PainOption)
  pain?: PainOption | null;

  @ApiProperty({ required: false, enum: MucusFeelingOption, nullable: true })
  @IsOptional()
  @IsEnum(MucusFeelingOption)
  mucusFeeling?: MucusFeelingOption | null;

  @ApiProperty({ required: false, enum: MucusAppearanceOption, nullable: true })
  @IsOptional()
  @IsEnum(MucusAppearanceOption)
  mucusAppearance?: MucusAppearanceOption | null;

  @ApiProperty({ required: false, enum: CervixPositionOption, nullable: true })
  @IsOptional()
  @IsEnum(CervixPositionOption)
  cervixPosition?: CervixPositionOption | null;

  @ApiProperty({ required: false, enum: CervixFeelingOption, nullable: true })
  @IsOptional()
  @IsEnum(CervixFeelingOption)
  cervixFeeling?: CervixFeelingOption | null;

  @ApiProperty({ required: false, enum: IntercourseOption, nullable: true })
  @IsOptional()
  @IsEnum(IntercourseOption)
  intercourse?: IntercourseOption | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  notes?: string | null;
}
