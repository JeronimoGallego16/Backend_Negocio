import { IsDateString, IsInt, Min, ValidateIf } from 'class-validator';

export class AssignPlayerTeamDto {
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsInt()
  @Min(1)
  playerId?: number;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsDateString()
  startDate?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsDateString()
  endDate?: string;
}
