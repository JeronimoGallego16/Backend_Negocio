import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from '../../matches/entities/match.entity';
import { Team } from '../../teams/entities/team.entity';
import { CompetitionGroup } from '../entities/competition-group.entity';
import { GroupPhase } from '../entities/group-phase.entity';
import { Phase } from '../entities/phase.entity';

/**
 * Repository for phase and group-specific queries.
 */
@Injectable()
export class PhasesRepository {
  /**
   * Creates the phases repository.
   *
   * @param phaseRepository - TypeORM repository for phases.
   * @param teamRepository - TypeORM repository for teams.
   * @param groupRepository - TypeORM repository for competition groups.
   * @param matchRepository - TypeORM repository for matches.
   */
  constructor(
    @InjectRepository(Phase)
    private readonly phaseRepository: Repository<Phase>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(CompetitionGroup)
    private readonly groupRepository: Repository<CompetitionGroup>,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
  ) {}

  /**
   * Checks whether an order is already used in a tournament.
   *
   * @param tournamentId - Tournament identifier.
   * @param order - Phase order.
   * @param excludedPhaseId - Phase excluded during updates.
   * @returns Whether the order is used.
   */
  async existsOrder(
    tournamentId: number,
    order: number,
    excludedPhaseId?: number,
  ): Promise<boolean> {
    const query = this.phaseRepository
      .createQueryBuilder('phase')
      .where('phase.tournamentId = :tournamentId', { tournamentId })
      .andWhere('phase.order = :order', { order });
    if (excludedPhaseId !== undefined) {
      query.andWhere('phase.phaseId != :excludedPhaseId', { excludedPhaseId });
    }
    return (await query.getCount()) > 0;
  }

  /**
   * Counts teams currently assigned to a group.
   *
   * @param groupId - Competition group identifier.
   * @returns Assignment count.
   */
  countGroupTeams(groupId: number): Promise<number> {
    return this.teamRepository.count({
      where: { groupId },
    });
  }

  /**
   * Checks whether a phase has matches.
   *
   * @param phaseId - Phase identifier.
   * @returns Whether associated matches exist.
   */
  async hasMatches(phaseId: number): Promise<boolean> {
    return (
      (await this.matchRepository.count({
        where: { phase: { phaseId } },
      })) > 0
    );
  }

  /**
   * Finds a competition group by identifier.
   *
   * @param groupId - Group identifier.
   * @returns The matching group or null.
   */
  findGroup(groupId: number): Promise<CompetitionGroup | null> {
    return this.groupRepository.findOne({
      where: { groupId },
      relations: { phase: true },
    });
  }

  /**
   * Finds a group phase by identifier.
   *
   * @param phaseId - Group phase identifier.
   * @returns The matching group phase or null.
   */
  findGroupPhase(phaseId: number): Promise<GroupPhase | null> {
    return this.phaseRepository.manager
      .getRepository(GroupPhase)
      .findOne({ where: { phaseId } });
  }

}
