import { IsInt, IsString, Matches, MaxLength, Min, ValidateIf } from 'class-validator';

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

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsInt()
  @Min(1)
  sportId?: number;
}
