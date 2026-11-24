/**
 * Response data representing a tournament phase.
 */
export class PhaseResponseDto {
  phaseId!: number;
  name!: string;
  order!: number;
  tournamentId!: number;
  type!: 'GROUP' | 'FINAL';
  isThirdPlace?: boolean;
  expectedMatchCount?: number | null;
}
