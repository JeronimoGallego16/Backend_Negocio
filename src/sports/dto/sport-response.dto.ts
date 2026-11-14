import { TeamSportResponseDto } from '../../team-sports/dto/team-sport-response.dto';

/**
 * Response data representing a sport.
 */
export class SportResponseDto {
  sportId!: number;
  name!: string;
  description!: string;
  parentSportId!: number | null;
  teamSports?: TeamSportResponseDto[];
}
