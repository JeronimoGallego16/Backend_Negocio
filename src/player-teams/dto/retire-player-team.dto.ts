import { IsDateString, ValidateIf } from 'class-validator';

export class RetirePlayerTeamDto {
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsDateString()
  endDate?: string;
}
