/**
 * Response data representing a group inside a group phase.
 */
export class CompetitionGroupResponseDto {
  groupId!: number;
  phaseId!: number;
  letterOrNumber!: string;
  maxTeams!: number;
}
