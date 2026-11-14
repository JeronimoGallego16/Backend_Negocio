import { TeamSportResponseDto } from '../../team-sports/dto/team-sport-response.dto';

/**
 * Response data representing a team.
 */
export class TeamResponseDto {
  teamId!: number;
  name!: string;
  category!: string;
  teamSports?: TeamSportResponseDto[];
}
