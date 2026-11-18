import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Registration } from '../entities/registration.entity';

/**
 * Repository for registration-specific queries.
 */
@Injectable()
export class RegistrationsRepository {
  /**
   * Creates the registration repository wrapper.
   *
   * @param registrationRepository - TypeORM repository for registrations.
   */
  constructor(
    @InjectRepository(Registration)
    private readonly registrationRepository: Repository<Registration>,
  ) {}

  /**
   * Checks whether a team is already registered in a tournament.
   *
   * @param tournamentId - Tournament identifier.
   * @param teamId - Team identifier.
   * @returns Whether the pair is already registered.
   */
  async existsByTournamentAndTeam(
    tournamentId: number,
    teamId: number,
  ): Promise<boolean> {
    return (
      (await this.registrationRepository.count({
        where: {
          tournament: { tournamentId },
          team: { teamId },
        },
      })) > 0
    );
  }

  /**
   * Counts registrations for a tournament.
   *
   * @param tournamentId - Tournament identifier.
   * @returns The number of registered teams.
   */
  countByTournament(tournamentId: number): Promise<number> {
    return this.registrationRepository.count({
      where: { tournament: { tournamentId } },
    });
  }
}
