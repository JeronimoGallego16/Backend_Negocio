import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayerSkill } from '../entities/player-skill.entity';

@Injectable()
export class PlayerSkillsRepository {
  constructor(
    @InjectRepository(PlayerSkill)
    private readonly playerSkillRepository: Repository<PlayerSkill>,
  ) {}

  findByPlayer(playerId: number): Promise<PlayerSkill[]> {
    return this.playerSkillRepository.find({
      where: { playerId },
      relations: { player: true, skill: true },
    });
  }

  findBySkill(skillId: number): Promise<PlayerSkill[]> {
    return this.playerSkillRepository.find({
      where: { skillId },
      relations: { player: true, skill: true },
    });
  }

  findOneByPair(
    playerId: number,
    skillId: number,
  ): Promise<PlayerSkill | null> {
    return this.playerSkillRepository.findOne({
      where: { playerId, skillId },
      relations: { player: true, skill: true },
    });
  }

  async existsByPair(playerId: number, skillId: number): Promise<boolean> {
    return (
      (await this.playerSkillRepository.count({
        where: { playerId, skillId },
      })) > 0
    );
  }
}
