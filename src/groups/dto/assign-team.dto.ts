import { IsInt, Min } from 'class-validator';

/**
 * Request data for assigning a team to a competition group.
 */
export class AssignTeamDto {
  @IsInt()
  @Min(1)
  teamId!: number;
}
