import { Module } from '@nestjs/common';
import { PlayerSkillsModule } from '../player-skills/player-skills.module';
import { PlayerTeamsModule } from '../player-teams/player-teams.module';
import { PlayersModule } from './players.module';
import { PlayerProfileController } from './player-profile.controller';
import { PlayerProfileService } from './player-profile.service';

@Module({
  imports: [PlayersModule, PlayerSkillsModule, PlayerTeamsModule],
  controllers: [PlayerProfileController],
  providers: [PlayerProfileService],
})
export class PlayerProfileModule {}
