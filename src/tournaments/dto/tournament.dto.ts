import {
  IsDateString,
  IsInt,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

/**
 * Request data for creating or updating a tournament.
 */
export class TournamentDto {
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @Matches(/\S/)
  @MaxLength(150)
  name?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @Matches(/\S/)
  @MaxLength(50)
  modality?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsDateString()
  startDate?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsDateString()
  endDate?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @Matches(/\S/)
  @MaxLength(30)
  status?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsInt()
  @Min(1)
  capacity?: number;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsInt()
  @Min(1)
  sportId?: number;
}
