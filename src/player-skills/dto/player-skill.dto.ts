import { IsInt, IsString, Max, Min, ValidateIf } from 'class-validator';

export class PlayerSkillDto {
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsInt()
  @Min(1)
  skillId?: number;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsInt()
  @Min(1)
  @Max(5)
  level?: number;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  observations?: string;
}
