import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Annotation } from '../../annotations/entities/annotation.entity';
import { PlayerTeam } from '../../player-teams/entities/player-team.entity';
import { PlayerSkill } from '../../player-skills/entities/player-skill.entity';
import { Player } from '../entities/player.entity';

@Injectable()
export class PlayersRepository {
  constructor(
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
  ) {}

  async existsByIdentification(
    identification: string,
    excludedPlayerId?: number,
  ): Promise<boolean> {
    const query = this.playerRepository
      .createQueryBuilder('player')
      .where('player.identification = :identification', { identification });

    if (excludedPlayerId !== undefined) {
      query.andWhere('player.playerId != :excludedPlayerId', {
        excludedPlayerId,
      });
    }

    return (await query.getCount()) > 0;
  }

  async existsByEmail(
    email: string,
    excludedPlayerId?: number,
  ): Promise<boolean> {
    const query = this.playerRepository
      .createQueryBuilder('player')
      .where('player.email = :email', { email });

    if (excludedPlayerId !== undefined) {
      query.andWhere('player.playerId != :excludedPlayerId', {
        excludedPlayerId,
      });
    }

    return (await query.getCount()) > 0;
  }

  async hasAssociatedData(playerId: number): Promise<boolean> {
    const manager = this.playerRepository.manager;
    const [skills, teams, annotations] = await Promise.all([
      manager.getRepository(PlayerSkill).count({ where: { playerId } }),
      manager.getRepository(PlayerTeam).count({ where: { playerId } }),
      manager.getRepository(Annotation).count({ where: { playerId } }),
    ]);

    return skills + teams + annotations > 0;
  }
}
