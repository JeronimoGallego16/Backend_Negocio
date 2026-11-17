import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { PlayerTeam } from '../entities/player-team.entity';

@Injectable()
export class PlayerTeamsRepository {
  constructor(
    @InjectRepository(PlayerTeam)
    private readonly playerTeamRepository: Repository<PlayerTeam>,
  ) {}

  findByPlayer(playerId: number): Promise<PlayerTeam[]> {
    return this.playerTeamRepository.find({
      where: { playerId },
      relations: { player: true, team: true },
      order: { startDate: 'DESC' },
    });
  }

  findByTeam(teamId: number, onDate?: string): Promise<PlayerTeam[]> {
    const query = this.playerTeamRepository
      .createQueryBuilder('playerTeam')
      .leftJoinAndSelect('playerTeam.player', 'player')
      .leftJoinAndSelect('playerTeam.team', 'team')
      .where('playerTeam.teamId = :teamId', { teamId });

    if (onDate !== undefined) {
      query
        .andWhere('playerTeam.startDate <= :onDate', { onDate })
        .andWhere(
          '(playerTeam.endDate IS NULL OR playerTeam.endDate > :onDate)',
          { onDate },
        );
    }

    return query.orderBy('playerTeam.startDate', 'DESC').getMany();
  }

  findOverlapping(
    playerId: number,
    startDate: string,
    endDate: string | null,
  ): Promise<PlayerTeam[]> {
    const query = this.playerTeamRepository
      .createQueryBuilder('playerTeam')
      .where('playerTeam.playerId = :playerId', { playerId })
      .andWhere(
        '(playerTeam.endDate IS NULL OR playerTeam.endDate > :startDate)',
        { startDate },
      );

    if (endDate !== null) {
      query.andWhere('playerTeam.startDate < :endDate', { endDate });
    }

    return query.getMany();
  }

  findOpenLink(playerId: number, teamId: number): Promise<PlayerTeam | null> {
    return this.playerTeamRepository.findOne({
      where: { playerId, teamId, endDate: IsNull() },
      relations: { player: true, team: true },
    });
  }

  async belongsToTeam(
    playerId: number,
    teamId: number,
    onDate: string,
  ): Promise<boolean> {
    return (
      (await this.playerTeamRepository
        .createQueryBuilder('playerTeam')
        .where('playerTeam.playerId = :playerId', { playerId })
        .andWhere('playerTeam.teamId = :teamId', { teamId })
        .andWhere('playerTeam.startDate <= :onDate', { onDate })
        .andWhere(
          '(playerTeam.endDate IS NULL OR playerTeam.endDate > :onDate)',
          { onDate },
        )
        .getCount()) > 0
    );
  }

  async saveClosingPrevious(
    previous: PlayerTeam | null,
    next: PlayerTeam,
  ): Promise<PlayerTeam> {
    await this.playerTeamRepository.manager.transaction(async (manager) => {
      if (previous) await manager.save(previous);
      await manager.save(next);
    });

    const saved = await this.playerTeamRepository.findOne({
      where: { playerTeamId: next.playerTeamId },
      relations: { player: true, team: true },
    });

    if (!saved) {
      throw new Error('Saved player-team assignment could not be reloaded');
    }

    return saved;
  }
}
