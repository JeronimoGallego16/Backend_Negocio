import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Registration } from '../../registrations/entities/registration.entity';
import { Tournament } from '../entities/tournament.entity';
import { Phase } from '../../phases/entities/phase.entity';

/**
 * Repository for tournament-specific queries.
 */
@Injectable()
export class TournamentsRepository {
  /**
   * Creates the tournament repository wrapper.
   *
   * @param tournamentRepository - TypeORM repository for tournaments.
   * @param registrationRepository - TypeORM repository for registrations.
   */
  constructor(
    @InjectRepository(Tournament)
    private readonly tournamentRepository: Repository<Tournament>,
    @InjectRepository(Registration)
    private readonly registrationRepository: Repository<Registration>,
    @InjectRepository(Phase)
    private readonly phaseRepository: Repository<Phase>,
  ) {}

  /**
   * Checks whether a tournament has registrations.
   *
   * @param tournamentId - Tournament identifier.
   * @returns Whether at least one registration exists.
   */
  async hasRegistrations(tournamentId: number): Promise<boolean> {
    return (
      (await this.registrationRepository.count({
        where: { tournament: { tournamentId } },
      })) > 0
    );
  }

  /**
   * Checks whether a tournament has phases.
   *
   * @param tournamentId - Tournament identifier.
   * @returns Whether at least one phase exists.
   */
  async hasPhases(tournamentId: number): Promise<boolean> {
    return (
      (await this.phaseRepository.count({
        where: { tournamentId },
      })) > 0
    );
  }

  /**
   * Checks whether another tournament has the same name.
   *
   * @param name - Tournament name to search for.
   * @param excludedTournamentId - Tournament ID excluded during updates.
   * @returns Whether a matching tournament exists.
   */
  async existsByName(
    name: string,
    excludedTournamentId?: number,
  ): Promise<boolean> {
    const query = this.tournamentRepository
      .createQueryBuilder('tournament')
      .where('tournament.name = :name', { name });
    if (excludedTournamentId !== undefined) {
      query.andWhere('tournament.tournamentId != :excludedTournamentId', {
        excludedTournamentId,
      });
    }
    return (await query.getCount()) > 0;
  }
}
