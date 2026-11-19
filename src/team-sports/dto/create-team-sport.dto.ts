import { IsInt, Min } from 'class-validator';

/**
 * Request data for assigning a sport to a team.
 */
export class CreateTeamSportDto {
  @IsInt()
  @Min(1)
  teamId!: number;

  @IsInt()
  @Min(1)
  sportId!: number;
}
