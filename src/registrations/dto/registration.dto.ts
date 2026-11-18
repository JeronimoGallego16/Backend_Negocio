import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

/**
 * Request data for creating or updating a registration.
 */
export class RegistrationDto {
  @IsDateString()
  @IsOptional()
  registrationDate?: string;

  @IsInt()
  @Min(1)
  tournamentId!: number;

  @IsInt()
  @Min(1)
  teamId!: number;
}
