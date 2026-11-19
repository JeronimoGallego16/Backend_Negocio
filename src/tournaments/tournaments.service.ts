import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationErrors } from '../common/errors/application-error';
import { Sport } from '../sports/entities/sport.entity';
import { TournamentDto } from './dto/tournament.dto';
import { TournamentResponseDto } from './dto/tournament-response.dto';
import { Tournament } from './entities/tournament.entity';
import { TournamentMapper } from './mappers/tournament.mapper';
import { TournamentsRepository } from './repositories/tournaments.repository';

/**
 * Business logic for managing tournaments.
 */
@Injectable()
export class TournamentsService {
  /**
   * Creates the tournament service.
   *
   * @param tournamentRepository - TypeORM repository used for tournament CRUD.
   * @param sportRepository - TypeORM repository used to verify sports.
   * @param tournamentsRepository - Repository for tournament-specific queries.
   * @param tournamentMapper - Mapper for tournament entities and DTOs.
   */
  constructor(
    @InjectRepository(Tournament)
    private readonly tournamentRepository: Repository<Tournament>,
    @InjectRepository(Sport)
    private readonly sportRepository: Repository<Sport>,
    private readonly tournamentsRepository: TournamentsRepository,
    private readonly tournamentMapper: TournamentMapper,
  ) {}

  /**
   * Creates a tournament after validating its dates and sport.
   *
   * @param dto - Required tournament data.
   * @returns The created tournament.
   * @throws ApplicationError When data is invalid or the sport does not exist.
   */
  async create(dto: TournamentDto): Promise<TournamentResponseDto> {
    this.validateRequiredFields(dto);
    this.validateDates(dto.startDate!, dto.endDate!);
    if (await this.tournamentsRepository.existsByName(dto.name!)) {
      throw ApplicationErrors.conflict('A tournament with this name already exists');
    }
    const sport = await this.sportRepository.findOne({
      where: { sportId: dto.sportId },
    });
    if (!sport) throw ApplicationErrors.notFound(`Sport with id ${dto.sportId} not found`);
    const entity = this.tournamentMapper.toEntity(dto);
    entity.sport = sport;
    return this.tournamentMapper.toResponseDto(
      await this.tournamentRepository.save(entity),
    );
  }

  /**
   * Retrieves every tournament with its sport.
   *
   * @returns All tournaments.
   */
  async findAll(): Promise<TournamentResponseDto[]> {
    const tournaments = await this.tournamentRepository.find({ relations: { sport: true } });
    return this.tournamentMapper.toResponseDtoList(tournaments);
  }

  /**
   * Retrieves a tournament by identifier.
   *
   * @param id - Tournament identifier.
   * @returns The matching tournament.
   * @throws ApplicationError When the tournament does not exist.
   */
  async findOne(id: number): Promise<TournamentResponseDto> {
    const tournament = await this.tournamentRepository.findOne({
      where: { tournamentId: id },
      relations: { sport: true },
    });
    if (!tournament) throw ApplicationErrors.notFound(`Tournament with id ${id} not found`);
    return this.tournamentMapper.toResponseDto(tournament);
  }

  /**
   * Updates supplied tournament fields.
   *
   * @param id - Tournament identifier.
   * @param dto - Fields to update.
   * @returns The updated tournament.
   * @throws ApplicationError When the tournament or sport does not exist.
   */
  async update(id: number, dto: TournamentDto): Promise<TournamentResponseDto> {
    const tournament = await this.tournamentRepository.findOne({
      where: { tournamentId: id },
      relations: { sport: true },
    });
    if (!tournament) throw ApplicationErrors.notFound(`Tournament with id ${id} not found`);
    const merged = this.tournamentMapper.mergeEntity(tournament, dto);
    if (!merged.name?.trim() || !merged.modality?.trim() || !merged.startDate || !merged.endDate || !merged.status || !merged.capacity || !merged.sport) {
      throw ApplicationErrors.invalidInput('Tournament fields cannot be empty');
    }
    this.validateDates(merged.startDate, merged.endDate);
    if (await this.tournamentsRepository.existsByName(merged.name, id)) {
      throw ApplicationErrors.conflict('A tournament with this name already exists');
    }
    if (dto.sportId !== undefined) {
      const sport = await this.sportRepository.findOne({ where: { sportId: dto.sportId } });
      if (!sport) throw ApplicationErrors.notFound(`Sport with id ${dto.sportId} not found`);
      merged.sport = sport;
    }
    return this.tournamentMapper.toResponseDto(
      await this.tournamentRepository.save(merged),
    );
  }

  /**
   * Deletes a tournament only when it has no registrations.
   *
   * @param id - Tournament identifier.
   * @returns Nothing when deletion succeeds.
   * @throws ApplicationError When the tournament is missing or still referenced.
   */
  async remove(id: number): Promise<void> {
    const tournament = await this.tournamentRepository.findOne({ where: { tournamentId: id } });
    if (!tournament) throw ApplicationErrors.notFound(`Tournament with id ${id} not found`);
    if (await this.tournamentsRepository.hasRegistrations(id)) {
      throw ApplicationErrors.conflict('A tournament with registrations cannot be deleted');
    }
    if (await this.tournamentsRepository.hasPhases(id)) {
      throw ApplicationErrors.conflict('A tournament with phases cannot be deleted');
    }
    await this.tournamentRepository.remove(tournament);
  }

  /**
   * Validates required create fields.
   *
   * @param dto - Tournament data to validate.
   * @returns Nothing when valid.
   */
  private validateRequiredFields(dto: TournamentDto): void {
    if (!dto.name?.trim() || !dto.modality?.trim() || !dto.startDate || !dto.endDate || !dto.status?.trim() || !dto.capacity || !dto.sportId) {
      throw ApplicationErrors.invalidInput('name, modality, dates, status, capacity and sportId are required');
    }
  }

  /**
   * Validates chronological tournament dates.
   *
   * @param startDate - Tournament start date.
   * @param endDate - Tournament end date.
   * @returns Nothing when valid.
   */
  private validateDates(startDate: string, endDate: string): void {
    if (new Date(startDate).getTime() > new Date(endDate).getTime()) {
      throw ApplicationErrors.invalidInput('startDate cannot be after endDate');
    }
  }
}
