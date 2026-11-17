import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayersModule } from '../players/players.module';
import { SkillsModule } from '../skills/skills.module';
import { PlayerSkill } from './entities/player-skill.entity';
import { PlayerSkillsController } from './player-skills.controller';
import { PlayerSkillsService } from './player-skills.service';
import { PlayerSkillMapper } from './mappers/player-skill.mapper';
import { PlayerSkillsRepository } from './repositories/player-skills.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlayerSkill]),
    PlayersModule,
    SkillsModule,
  ],
  controllers: [PlayerSkillsController],
  providers: [PlayerSkillsService, PlayerSkillMapper, PlayerSkillsRepository],
  exports: [PlayerSkillsService],
})
export class PlayerSkillsModule {}
