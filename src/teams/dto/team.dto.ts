import { IsString, Matches, MaxLength, ValidateIf } from 'class-validator';

/**
 * Request data for creating or updating a team.
 */
export class TeamDto {
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @Matches(/\S/)
  @MaxLength(120)
  name?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @Matches(/\S/)
  @MaxLength(80)
  category?: string;
}
