import { PlayerTeamResponseDto } from '../../player-teams/dto/player-team-response.dto';
import { PlayerSkillResponseDto } from '../../player-skills/dto/player-skill-response.dto';
import { PlayerResponseDto } from './player-response.dto';

export class PlayerProfileResponseDto {
  player!: PlayerResponseDto;
  skills!: PlayerSkillResponseDto[];
  teams!: PlayerTeamResponseDto[];
}
