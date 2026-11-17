export class PlayerTeamResponseDto {
  playerTeamId!: number;
  playerId!: number;
  teamId!: number;
  startDate!: string;
  endDate!: string | null;
  playerName!: string;
  teamName!: string;
}
