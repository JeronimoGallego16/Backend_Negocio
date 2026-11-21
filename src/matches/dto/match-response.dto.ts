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
  homeScore?: number;
  awayScore?: number;
  roundName?: string;
  bracketPosition?: number;
  nextMatchId?: number;
  isThirdPlace!: boolean;
  resultRegistered!: boolean;
}
