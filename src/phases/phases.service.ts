import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationErrors } from '../common/errors/application-error';
import { CompetitionGroup } from '../groups/entities/competition-group.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { PhaseDto } from './dto/phase.dto';
import { PhaseResponseDto } from './dto/phase-response.dto';
import { FinalPhase } from './entities/final.entity';
import { GroupPhase } from './entities/group-phase.entity';
import { Phase } from './entities/phase.entity';
import { PhaseMapper } from './mappers/phase.mapper';
import { PhasesRepository } from './repositories/phases.repository';

/**
 * Service responsible for tournament phase CRUD.
 */
@Injectable()
export class PhasesService {
  /**
   * Creates the phases service.
   *
   * @param phaseRepository - Phase repository.
   * @param groupRepository - Competition group repository.
   * @param tournamentRepository - Tournament repository.
   * @param phasesRepository - Phase-specific repository.
   * @param phaseMapper - Phase mapper.
   */
  constructor(
    @InjectRepository(Phase)
    private readonly phaseRepository: Repository<Phase>,
    @InjectRepository(CompetitionGroup)
    private readonly groupRepository: Repository<CompetitionGroup>,
    @InjectRepository(Tournament)
    private readonly tournamentRepository: Repository<Tournament>,
    private readonly phasesRepository: PhasesRepository,
    private readonly phaseMapper: PhaseMapper,
  ) {}

  /**
   * Creates a group phase or final phase.
   *
   * @param dto - Phase data.
   * @returns The created phase.
   */
  async create(dto: PhaseDto): Promise<PhaseResponseDto> {
    if (!dto.name?.trim() || !dto.order || !dto.tournamentId || !dto.type) {
      throw ApplicationErrors.invalidInput(
        'name, order, tournamentId and type are required',
      );
    }
    const tournament = await this.tournamentRepository.findOne({
      where: { tournamentId: dto.tournamentId },
    });
    if (!tournament) {
      throw ApplicationErrors.notFound(
        `Tournament with id ${dto.tournamentId} not found`,
      );
    }
    if (await this.phasesRepository.existsOrder(dto.tournamentId, dto.order)) {
      throw ApplicationErrors.conflict(
        'That phase order is already used in the tournament',
      );
    }
    const phase = this.phaseMapper.toEntity(dto);
    phase.tournamentId = tournament.tournamentId;
    return this.phaseMapper.toResponseDto(
      await this.phaseRepository.save(phase),
    );
  }

  /**
   * Lists phases, optionally filtered by tournament.
   *
   * @param tournamentId - Optional tournament filter.
   * @returns Matching phases.
   */
  async findAll(tournamentId?: number): Promise<PhaseResponseDto[]> {
    const phases = await this.phaseRepository.find({
      where: tournamentId === undefined ? {} : { tournamentId },
      order: { order: 'ASC' },
    });
    return this.phaseMapper.toResponseDtoList(phases);
  }

  /**
   * Retrieves a phase.
   *
   * @param phaseId - Phase identifier.
   * @returns The matching phase.
   */
  async findOne(phaseId: number): Promise<PhaseResponseDto> {
    const phase = await this.findPhase(phaseId);
    return this.phaseMapper.toResponseDto(phase);
  }

  /**
   * Updates a phase without changing its subtype or tournament.
   *
   * @param phaseId - Phase identifier.
   * @param dto - Fields to update.
   * @returns The updated phase.
   */
  async update(
    phaseId: number,
    dto: PhaseDto,
  ): Promise<PhaseResponseDto> {
    const phase = await this.findPhase(phaseId);
    if (dto.tournamentId !== undefined && dto.tournamentId !== phase.tournamentId) {
      throw ApplicationErrors.invalidInput(
        'A phase tournament cannot be changed',
      );
    }
    if (
      dto.type !== undefined &&
      ((dto.type === 'GROUP' && !(phase instanceof GroupPhase)) ||
        (dto.type === 'FINAL' && !(phase instanceof FinalPhase)))
    ) {
      throw ApplicationErrors.invalidInput(
        'A phase subtype cannot be changed after creation',
      );
    }
    if (
      dto.order !== undefined &&
      (await this.phasesRepository.existsOrder(
        phase.tournamentId,
        dto.order,
        phaseId,
      ))
    ) {
      throw ApplicationErrors.conflict(
        'That phase order is already used in the tournament',
      );
    }
    return this.phaseMapper.toResponseDto(
      await this.phaseRepository.save(this.phaseMapper.mergeEntity(phase, dto)),
    );
  }

  /**
   * Deletes a phase when no associated information prevents it.
   *
   * @param phaseId - Phase identifier.
   * @returns Nothing after deletion.
   */
  async remove(phaseId: number): Promise<void> {
    const phase = await this.findPhase(phaseId);
    if (await this.phasesRepository.hasMatches(phaseId)) {
      throw ApplicationErrors.conflict('A phase with matches cannot be deleted');
    }
    if (
      phase instanceof GroupPhase &&
      (await this.groupRepository.count({ where: { phaseId } })) > 0
    ) {
      throw ApplicationErrors.conflict(
        'A group phase with competition groups cannot be deleted',
      );
    }
    await this.phaseRepository.remove(phase);
  }

  /**
   * Finds a phase.
   *
   * @param phaseId - Phase identifier.
   * @returns The matching phase.
   */
  private async findPhase(phaseId: number): Promise<Phase> {
    const phase = await this.phaseRepository.findOne({ where: { phaseId } });
    if (!phase) {
      throw ApplicationErrors.notFound(`Phase with id ${phaseId} not found`);
    }
    return phase;
  }
}
