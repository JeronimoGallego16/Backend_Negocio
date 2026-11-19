/**
 * Response data representing a tournament phase.
 */
export class PhaseResponseDto {
  phaseId!: number;
  name!: string;
  order!: number;
  tournamentId!: number;
  type!: 'GROUP' | 'FINAL';
  letterOrNumber?: string;
  maxTeams?: number;
  isThirdPlace?: boolean;
}
