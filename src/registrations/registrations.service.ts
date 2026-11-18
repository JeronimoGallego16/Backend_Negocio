import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationErrors } from '../common/errors/application-error';
import { Team } from '../teams/entities/team.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
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
    if (tournament.status.toUpperCase() !== 'OPEN' || this.hasStarted(tournament.startDate)) {
      throw ApplicationErrors.conflict('The tournament is not accepting registrations');
    }
    if (team.sportId !== tournament.sport.sportId) {
      throw ApplicationErrors.invalidInput('The team and tournament must belong to the same sport');
    }
    if (await this.registrationsRepository.existsByTournamentAndTeam(dto.tournamentId, dto.teamId)) {
      throw ApplicationErrors.conflict('The team is already registered in this tournament');
    }
    if (await this.registrationsRepository.countByTournament(dto.tournamentId) >= tournament.capacity) {
      throw ApplicationErrors.conflict('The tournament capacity has been reached');
    }
    const registration = this.registrationMapper.toEntity(dto);
    registration.tournament = tournament;
    registration.team = team;
    return this.registrationMapper.toResponseDto(
      await this.registrationRepository.save(registration),
    );
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
  async remove(id: number): Promise<void> {
    const registration = await this.registrationRepository.findOne({
      where: { registrationId: id },
      relations: { tournament: true },
    });
    if (!registration) throw ApplicationErrors.notFound(`Registration with id ${id} not found`);
    if (registration.tournament.status.toUpperCase() !== 'OPEN' || this.hasStarted(registration.tournament.startDate)) {
      throw ApplicationErrors.conflict('The tournament no longer allows registration withdrawals');
    }
    await this.registrationRepository.remove(registration);
  }

  /**
   * Determines whether the tournament start date has passed.
   *
   * @param startDate - Tournament start date.
   * @returns Whether the tournament has started.
   */
  private hasStarted(startDate: string): boolean {
    return new Date(`${startDate}T00:00:00`).getTime() <= Date.now();
  }
}
