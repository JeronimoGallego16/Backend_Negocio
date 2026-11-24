/**
 * Response data representing a match.
 */
export class MatchResponseDto {
  matchId!: number;
  duration!: string;
  state!: string;
  phaseId?: number;
  homeTeamId!: number | null;
  awayTeamId!: number | null;
  homeScore?: number | null;
  awayScore?: number | null;
  roundName?: string;
  bracketPosition?: number;
  nextMatchId?: number;
  isThirdPlace!: boolean;
  resultRegistered!: boolean;
}
