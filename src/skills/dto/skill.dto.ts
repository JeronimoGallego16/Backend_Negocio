import { IsString, Matches, MaxLength, ValidateIf } from 'class-validator';

export class SkillDto {
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @Matches(/\S/)
  @MaxLength(100)
  name?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @MaxLength(255)
  description?: string;
}
