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
    const existingPhases = await this.phaseRepository.find({
      where: { tournamentId: dto.tournamentId },
      order: { order: 'ASC' },
    });
    this.assertConsecutiveOrders(existingPhases);
    const nextOrder = existingPhases.length + 1;
    if (dto.order !== nextOrder) {
      throw ApplicationErrors.invalidInput(
        `Create phases in order. The next available order is ${nextOrder}`,
      );
    }
    this.assertPhaseFields(dto);
    if (dto.type === 'FINAL') {
      this.assertFinalPhaseChain(
        dto.order,
        dto.expectedMatchCount ?? null,
        dto.isThirdPlace ?? false,
        existingPhases,
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
    this.assertPhaseFields(dto, phase);
    const updated = this.phaseMapper.mergeEntity(phase, dto);
    const phases = await this.phaseRepository.find({
      where: { tournamentId: phase.tournamentId },
      order: { order: 'ASC' },
    });
    const otherPhases = phases.filter((item) => item.phaseId !== phaseId);
    if (dto.order !== undefined) {
      this.assertConsecutiveOrders([...otherPhases, updated]);
    }
    if (updated instanceof FinalPhase) {
      this.assertFinalPhaseChain(
        updated.order,
        updated.expectedMatchCount ?? null,
        updated.isThirdPlace,
        otherPhases,
      );
      if (
        dto.expectedMatchCount !== undefined ||
        dto.isThirdPlace !== undefined
      ) {
        this.assertExistingMatchesFitPhase(
          updated,
          await this.phasesRepository.findMatchesByPhase(phaseId),
        );
      }
    }
    return this.phaseMapper.toResponseDto(
      await this.phaseRepository.save(updated),
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
    const laterPhases = await this.phaseRepository.find({
      where: { tournamentId: phase.tournamentId },
    });
    if (laterPhases.some((candidate) => candidate.order > phase.order)) {
      throw ApplicationErrors.conflict(
        'Delete later tournament phases before deleting this phase',
      );
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

  private assertPhaseFields(dto: PhaseDto, phase?: Phase): void {
    const isFinal = phase
      ? phase instanceof FinalPhase
      : dto.type === 'FINAL';
    if (isFinal && dto.type === 'GROUP') {
      throw ApplicationErrors.invalidInput(
        'A phase subtype cannot be changed after creation',
      );
    }
    if (!isFinal && dto.expectedMatchCount !== undefined) {
      throw ApplicationErrors.invalidInput(
        'expectedMatchCount is only valid for final phases',
      );
    }
    if (!isFinal && dto.isThirdPlace) {
      throw ApplicationErrors.invalidInput(
        'isThirdPlace is only valid for final phases',
      );
    }
    if (isFinal && dto.expectedMatchCount !== undefined) {
      if (
        !Number.isInteger(dto.expectedMatchCount) ||
        dto.expectedMatchCount < 1
      ) {
        throw ApplicationErrors.invalidInput(
          'expectedMatchCount must be a positive integer',
        );
      }
    }
  }

  private assertConsecutiveOrders(phases: Phase[]): void {
    const ordered = [...phases].sort((left, right) => left.order - right.order);
    if (ordered.some((phase, index) => phase.order !== index + 1)) {
      throw ApplicationErrors.conflict(
        'Tournament phases must have consecutive orders starting at 1',
      );
    }
  }

  private assertFinalPhaseChain(
    order: number,
    expectedMatchCount: number | null,
    isThirdPlace: boolean,
    otherPhases: Phase[],
  ): void {
    if (expectedMatchCount === null || expectedMatchCount < 1) {
      throw ApplicationErrors.invalidInput(
        'expectedMatchCount is required and must be positive for final phases',
      );
    }
    if (!Number.isInteger(Math.log2(expectedMatchCount))) {
      throw ApplicationErrors.invalidInput(
        'expectedMatchCount must be a power of two so consecutive rounds can halve to one final match',
      );
    }
    const finalPhases = otherPhases
      .filter((phase): phase is FinalPhase => phase instanceof FinalPhase)
      .sort((left, right) => left.order - right.order);
    const previousPhases = finalPhases.filter(
      (phase) => phase.order < order,
    );
    const previous = previousPhases[previousPhases.length - 1];
    const next = finalPhases.find((phase) => phase.order > order);

    if (previous) {
      if (previous.expectedMatchCount == null) {
        throw ApplicationErrors.conflict(
          `Set the expected match count for ${previous.name} before adding another final round`,
        );
      }
      if (
        previous.expectedMatchCount % 2 !== 0 ||
        expectedMatchCount !== previous.expectedMatchCount / 2
      ) {
        throw ApplicationErrors.invalidInput(
          `This round must contain exactly half the main matches of ${previous.name}`,
        );
      }
    }

    if (
      next &&
      (expectedMatchCount % 2 !== 0 ||
        next.expectedMatchCount !== expectedMatchCount / 2)
    ) {
      throw ApplicationErrors.conflict(
        `The expected match count must preserve the halving rule for ${next.name}`,
      );
    }

    if (
      isThirdPlace &&
      (expectedMatchCount !== 1 ||
        previous?.expectedMatchCount !== 2)
    ) {
      throw ApplicationErrors.invalidInput(
        'A third-place match requires a final round with one main match after a round of two matches',
      );
    }
  }

  private assertExistingMatchesFitPhase(
    phase: FinalPhase,
    matches: Awaited<ReturnType<PhasesRepository['findMatchesByPhase']>>,
  ): void {
    const expectedTotal =
      (phase.expectedMatchCount ?? 0) + (phase.isThirdPlace ? 1 : 0);
    if (matches.length > expectedTotal) {
      throw ApplicationErrors.conflict(
        'The new round configuration is smaller than the matches already registered',
      );
    }

    const seenPositions = new Set<string>();
    for (const match of matches) {
      if (!match.bracketPosition) {
        throw ApplicationErrors.conflict(
          `Match #${match.matchId} needs a bracket position before changing the round configuration`,
        );
      }
      if (
        match.isThirdPlace &&
        (!phase.isThirdPlace || match.bracketPosition !== 1)
      ) {
        throw ApplicationErrors.conflict(
          'The third-place match requires a phase configured for third place and position 1',
        );
      }
      if (
        !match.isThirdPlace &&
        match.bracketPosition > (phase.expectedMatchCount ?? 0)
      ) {
        throw ApplicationErrors.conflict(
          `Match #${match.matchId} is outside the configured bracket positions`,
        );
      }
      const positionKey = `${match.isThirdPlace}:${match.bracketPosition}`;
      if (seenPositions.has(positionKey)) {
        throw ApplicationErrors.conflict(
          `Bracket position ${match.bracketPosition} is duplicated in ${phase.name}`,
        );
      }
      seenPositions.add(positionKey);
    }
  }
}
