/**
 * Response data representing a tournament.
 */
export class TournamentResponseDto {
  tournamentId!: number;
  name!: string;
  modality!: string;
  startDate!: string;
  endDate!: string;
  status!: string;
  capacity!: number;
  sportId!: number;
}
