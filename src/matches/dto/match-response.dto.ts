/**
 * Response data representing a match.
 */
export class MatchResponseDto {
  matchId!: number;
  duration!: string;
  state!: string;
  phaseId?: number;
  homeTeamId!: number;
  awayTeamId!: number;
}
