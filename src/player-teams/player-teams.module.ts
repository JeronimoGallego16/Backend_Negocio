import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayersModule } from '../players/players.module';
import { TeamsModule } from '../teams/teams.module';
import { PlayerTeam } from './entities/player-team.entity';
import { PlayerTeamsController } from './player-teams.controller';
import { PlayerTeamsService } from './player-teams.service';
import { PlayerTeamMapper } from './mappers/player-team.mapper';
import { PlayerTeamsRepository } from './repositories/player-teams.repository';

@Module({
  imports: [TypeOrmModule.forFeature([PlayerTeam]), PlayersModule, TeamsModule],
  controllers: [PlayerTeamsController],
  providers: [PlayerTeamsService, PlayerTeamMapper, PlayerTeamsRepository],
  exports: [PlayerTeamsService],
})
export class PlayerTeamsModule {}
