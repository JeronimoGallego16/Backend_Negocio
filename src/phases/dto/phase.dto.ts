import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

/**
 * Request data for creating or updating a tournament phase.
 */
export class PhaseDto {
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @Matches(/\S/)
  @MaxLength(150)
  name?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsInt()
  @Min(1)
  order?: number;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsInt()
  @Min(1)
  tournamentId?: number;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsIn(['GROUP', 'FINAL'])
  type?: 'GROUP' | 'FINAL';

  @IsOptional()
  @IsBoolean()
  isThirdPlace?: boolean;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsInt()
  @Min(1)
  expectedMatchCount?: number;
}
