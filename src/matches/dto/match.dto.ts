import { IsString, Matches, MaxLength, ValidateIf } from 'class-validator';

/**
 * Request data for creating or updating a match.
 */
export class MatchDto {
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @Matches(/\S/)
  @MaxLength(50)
  duration?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @Matches(/\S/)
  @MaxLength(50)
  state?: string;
}
