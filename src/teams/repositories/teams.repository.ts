import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from '../entities/team.entity';

/**
 * Repository for team-specific duplicate checks.
 */
@Injectable()
export class TeamsRepository {
  /**
   * Creates the team repository wrapper.
   *
   * @param teamRepository - TypeORM repository for teams.
   */
  constructor(
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
  ) {}

  /**
   * Checks whether another team has the supplied natural key.
   *
   * @param name - Team name to search for.
   * @param category - Team category to search for.
   * @param excludedTeamId - Team ID excluded during updates.
   * @returns Whether a matching team exists.
   */
  async existsByNameAndCategory(
    name: string,
    category: string,
    excludedTeamId?: number,
  ): Promise<boolean> {
    const query = this.teamRepository
      .createQueryBuilder('team')
      .where('team.name = :name', { name })
      .andWhere('team.category = :category', { category });

    if (excludedTeamId !== undefined) {
      query.andWhere('team.teamId != :excludedTeamId', { excludedTeamId });
    }

    return (await query.getCount()) > 0;
  }

  /**
   * Checks whether a team participates in any match as either side.
   *
   * @param teamId - Team identifier.
   * @returns Whether a home or away match refers to the team.
   */
  async hasMatches(teamId: number): Promise<boolean> {
    const count = await this.teamRepository
      .createQueryBuilder('team')
      .leftJoin('team.homeMatches', 'homeMatch')
      .leftJoin('team.awayMatches', 'awayMatch')
      .where('team.teamId = :teamId', { teamId })
      .andWhere('(homeMatch.matchId IS NOT NULL OR awayMatch.matchId IS NOT NULL)')
      .getCount();

    return count > 0;
  }
}
