import {
  IsDateString,
  IsInt,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateIf,
  IsIn,
} from 'class-validator';

/**
 * Stable tournament lifecycle states.
 */
export enum TournamentStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
  CANCELLED = 'CANCELLED',
}

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
  @IsIn(Object.values(TournamentStatus))
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
