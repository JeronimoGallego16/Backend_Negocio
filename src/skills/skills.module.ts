import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SkillsController } from './skills.controller';
import { SkillsService } from './skills.service';
import { Skill } from './entities/skill.entity';
import { SkillMapper } from './mappers/skill.mapper';
import { SkillsRepository } from './repositories/skills.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Skill])],
  controllers: [SkillsController],
  providers: [SkillsService, SkillMapper, SkillsRepository],
  exports: [SkillsService],
})
export class SkillsModule {}
