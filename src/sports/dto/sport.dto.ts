import { IsString, Matches, MaxLength, ValidateIf } from 'class-validator';

/**
 * Request data for creating or updating a sport.
 */
export class SportDto {
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @Matches(/\S/)
  @MaxLength(120)
  name?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @Matches(/\S/)
  description?: string;
}
