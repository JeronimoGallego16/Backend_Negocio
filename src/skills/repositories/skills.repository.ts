import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayerSkill } from '../../player-skills/entities/player-skill.entity';
import { Skill } from '../entities/skill.entity';

@Injectable()
export class SkillsRepository {
  constructor(
    @InjectRepository(Skill)
    private readonly skillRepository: Repository<Skill>,
  ) {}

  async existsByName(name: string, excludedSkillId?: number): Promise<boolean> {
    const query = this.skillRepository
      .createQueryBuilder('skill')
      .where('skill.name = :name', { name });

    if (excludedSkillId !== undefined) {
      query.andWhere('skill.skillId != :excludedSkillId', {
        excludedSkillId,
      });
    }

    return (await query.getCount()) > 0;
  }

  async hasAssignedPlayers(skillId: number): Promise<boolean> {
    const count = await this.skillRepository.manager
      .getRepository(PlayerSkill)
      .count({ where: { skillId } });
    return count > 0;
  }
}
