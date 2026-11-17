import { Injectable } from '@nestjs/common';
import { PlayerProfileResponseDto } from './dto/player-profile-response.dto';
import { PlayerSkillsService } from '../player-skills/player-skills.service';
import { PlayerTeamsService } from '../player-teams/player-teams.service';
import { PlayersService } from './players.service';

@Injectable()
export class PlayerProfileService {
  constructor(
    private readonly playersService: PlayersService,
    private readonly playerSkillsService: PlayerSkillsService,
    private readonly playerTeamsService: PlayerTeamsService,
  ) {}

  async getProfile(playerId: number): Promise<PlayerProfileResponseDto> {
    const [player, skills, teams] = await Promise.all([
      this.playersService.findOne(playerId),
      this.playerSkillsService.findByPlayer(playerId),
      this.playerTeamsService.findByPlayer(playerId),
    ]);

    return { player, skills, teams };
  }
}
