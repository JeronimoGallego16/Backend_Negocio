import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationErrors } from '../common/errors/application-error';
import { Team } from '../teams/entities/team.entity';
import { TeamSport } from '../team-sports/entities/team-sport.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { TournamentStatus } from '../tournaments/dto/tournament.dto';
import { RegistrationDto } from './dto/registration.dto';
import { RegistrationResponseDto } from './dto/registration-response.dto';
import { Registration } from './entities/registration.entity';
import { RegistrationMapper } from './mappers/registration.mapper';
import { RegistrationsRepository } from './repositories/registrations.repository';

/**
 * Business logic for managing tournament registrations.
 */
@Injectable()
export class RegistrationsService {
  /**
   * Creates the registrations service.
   *
   * @param registrationRepository - TypeORM repository used for registration CRUD.
   * @param tournamentRepository - TypeORM repository used to verify tournaments.
   * @param teamRepository - TypeORM repository used to verify teams.
   * @param teamSportRepository - Repository used to verify team sport assignments.
   * @param registrationsRepository - Repository for registration-specific queries.
   * @param registrationMapper - Mapper for registration entities and DTOs.
   */
  constructor(
    @InjectRepository(Registration)
    private readonly registrationRepository: Repository<Registration>,
    @InjectRepository(Tournament)
    private readonly tournamentRepository: Repository<Tournament>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(TeamSport)
    private readonly teamSportRepository: Repository<TeamSport>,
    private readonly registrationsRepository: RegistrationsRepository,
    private readonly registrationMapper: RegistrationMapper,
  ) {}

  /**
   * Registers a team in a tournament after checking business rules.
   *
   * @param dto - Tournament and team identifiers.
   * @returns The created registration.
   * @throws ApplicationError When any registration rule is violated.
   */
  async create(dto: RegistrationDto): Promise<RegistrationResponseDto> {
    const tournament = await this.tournamentRepository.findOne({
      where: { tournamentId: dto.tournamentId },
      relations: { sport: true },
    });
    if (!tournament) throw ApplicationErrors.notFound(`Tournament with id ${dto.tournamentId} not found`);
    const team = await this.teamRepository.findOne({ where: { teamId: dto.teamId } });
    if (!team) throw ApplicationErrors.notFound(`Team with id ${dto.teamId} not found`);
    if (!this.isRegistrationOpen(tournament)) {
      throw ApplicationErrors.conflict(
        'The tournament is not accepting registrations',
      );
    }
    const teamSport = await this.teamSportRepository.findOne({
      where: {
        team: { teamId: team.teamId },
        sport: { sportId: tournament.sport.sportId },
      },
    });
    if (!teamSport) {
      throw ApplicationErrors.invalidInput(
        'The team must be assigned to the tournament sport',
      );
    }
    if (
      await this.registrationsRepository.existsByTournamentAndTeam(
        dto.tournamentId,
        dto.teamId,
      )
    ) {
      throw ApplicationErrors.conflict(
        'The team is already registered in this tournament',
      );
    }
    if (
      (await this.registrationsRepository.countByTournament(dto.tournamentId)) >=
      tournament.capacity
    ) {
      throw ApplicationErrors.conflict(
        'The tournament capacity has been reached',
      );
    }
    const registration = this.registrationMapper.toEntity(dto);
    registration.tournament = tournament;
    registration.team = team;
    try {
      return this.registrationMapper.toResponseDto(
        await this.registrationRepository.save(registration),
      );
    } catch (error: unknown) {
      if (ApplicationErrors.isDuplicateKeyViolation(error)) {
        throw ApplicationErrors.conflict(
          'The team is already registered in this tournament',
        );
      }
      throw error;
    }
  }

  /**
   * Lists registrations, optionally filtered by tournament or team.
   *
   * @param tournamentId - Optional tournament filter.
   * @param teamId - Optional team filter.
   * @returns Matching registrations.
   */
  async findAll(tournamentId?: number, teamId?: number): Promise<RegistrationResponseDto[]> {
    const registrations = await this.registrationRepository.find({
      where: {
        ...(tournamentId !== undefined && { tournament: { tournamentId } }),
        ...(teamId !== undefined && { team: { teamId } }),
      },
      relations: { tournament: true, team: true },
    });
    return this.registrationMapper.toResponseDtoList(registrations);
  }

  /**
   * Removes a registration before the tournament starts.
   *
   * @param id - Registration identifier.
   * @returns Nothing when removal succeeds.
   * @throws ApplicationError When the registration is missing or withdrawal is closed.
   */
  async remove(id: number): Promise<{ message: string }> {
    const registration = await this.registrationRepository.findOne({
      where: { registrationId: id },
      relations: { tournament: true },
    });
    if (!registration) throw ApplicationErrors.notFound(`Registration with id ${id} not found`);
    if (!this.isRegistrationOpen(registration.tournament)) {
      throw ApplicationErrors.conflict(
        'The tournament no longer allows registration withdrawals',
      );
    }
    await this.registrationRepository.remove(registration);
    return { message: `Registration #${id} withdrawn successfully` };
  }

  /**
   * Checks whether registration is currently open for the tournament.
   *
   * Registration remains open through the configured closing date. When no
   * closing date is configured, the tournament start date is the deadline.
   *
   * @param tournament - Tournament to check.
   * @returns Whether registrations and withdrawals are allowed.
   */
  private isRegistrationOpen(tournament: Tournament): boolean {
    const today = new Date().toISOString().slice(0, 10);
    const startDate = tournament.startDate.slice(0, 10);
    const registrationEndDate = (
      tournament.registrationEndDate ?? tournament.startDate
    ).slice(0, 10);

    return (
      tournament.status.toUpperCase() === TournamentStatus.OPEN &&
      today < startDate &&
      today <= registrationEndDate
    );
  }
}
