import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationErrors } from '../common/errors/application-error';
import { Team } from '../teams/entities/team.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { AssignTeamDto } from './dto/assign-team.dto';
import { CompetitionGroupDto } from './dto/competition-group.dto';
import { CompetitionGroupResponseDto } from './dto/competition-group-response.dto';
import { PhaseDto } from './dto/phase.dto';
import { PhaseResponseDto } from './dto/phase-response.dto';
import { CompetitionGroup } from './entities/competition-group.entity';
import { FinalPhase } from './entities/final.entity';
import { GroupPhase } from './entities/group-phase.entity';
import { Phase } from './entities/phase.entity';
import { CompetitionGroupMapper } from './mappers/competition-group.mapper';
import { PhaseMapper } from './mappers/phase.mapper';
import { PhasesRepository } from './repositories/phases.repository';

/**
 * Business logic for tournament phases, competition groups and assignments.
 */
@Injectable()
export class PhasesService {
  /**
   * Creates the phases service.
   *
   * @param phaseRepository - Repository for phases.
   * @param groupRepository - Repository for competition groups.
   * @param tournamentRepository - Repository for tournaments.
   * @param teamRepository - Repository for teams.
   * @param phasesRepository - Repository for phase-specific queries.
   * @param phaseMapper - Mapper for phases.
   * @param groupMapper - Mapper for competition groups.
   */
  constructor(
    @InjectRepository(Phase)
    private readonly phaseRepository: Repository<Phase>,
    @InjectRepository(CompetitionGroup)
    private readonly groupRepository: Repository<CompetitionGroup>,
    @InjectRepository(Tournament)
    private readonly tournamentRepository: Repository<Tournament>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    private readonly phasesRepository: PhasesRepository,
    private readonly phaseMapper: PhaseMapper,
    private readonly groupMapper: CompetitionGroupMapper,
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
   * Retrieves a phase by identifier.
   *
   * @param phaseId - Phase identifier.
   * @returns The matching phase.
   */
  async findOne(phaseId: number): Promise<PhaseResponseDto> {
    const phase = await this.phaseRepository.findOne({ where: { phaseId } });
    if (!phase) {
      throw ApplicationErrors.notFound(`Phase with id ${phaseId} not found`);
    }
    return this.phaseMapper.toResponseDto(phase);
  }

  /**
   * Updates a phase without changing its subtype.
   *
   * @param phaseId - Phase identifier.
   * @param dto - Fields to update.
   * @returns The updated phase.
   */
  async update(
    phaseId: number,
    dto: PhaseDto,
  ): Promise<PhaseResponseDto> {
    const phase = await this.phaseRepository.findOne({ where: { phaseId } });
    if (!phase) {
      throw ApplicationErrors.notFound(`Phase with id ${phaseId} not found`);
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
   * @returns Nothing when deletion succeeds.
   */
  async remove(phaseId: number): Promise<void> {
    const phase = await this.phaseRepository.findOne({ where: { phaseId } });
    if (!phase) {
      throw ApplicationErrors.notFound(`Phase with id ${phaseId} not found`);
    }
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
   * Creates a group inside a group phase.
   *
   * @param phaseId - Parent group phase identifier.
   * @param dto - Group data.
   * @returns The created group.
   */
  async createGroup(
    phaseId: number,
    dto: CompetitionGroupDto,
  ): Promise<CompetitionGroupResponseDto> {
    const phase = await this.phasesRepository.findGroupPhase(phaseId);
    if (!phase) {
      throw ApplicationErrors.notFound(
        `Group phase with id ${phaseId} not found`,
      );
    }
    if (!dto.letterOrNumber?.trim() || !dto.maxTeams) {
      throw ApplicationErrors.invalidInput(
        'letterOrNumber and maxTeams are required',
      );
    }
    const existing = await this.groupRepository.findOne({
      where: { phaseId, letterOrNumber: dto.letterOrNumber.trim() },
    });
    if (existing) {
      throw ApplicationErrors.conflict(
        'That group identifier is already used in the phase',
      );
    }
    const group = this.groupMapper.toEntity(
      { ...dto, letterOrNumber: dto.letterOrNumber.trim() },
      phaseId,
    );
    return this.groupMapper.toResponseDto(
      await this.groupRepository.save(group),
    );
  }

  /**
   * Lists all groups inside a group phase.
   *
   * @param phaseId - Parent group phase identifier.
   * @returns The groups in the phase.
   */
  async findGroups(phaseId: number): Promise<CompetitionGroupResponseDto[]> {
    const phase = await this.phasesRepository.findGroupPhase(phaseId);
    if (!phase) {
      throw ApplicationErrors.notFound(
        `Group phase with id ${phaseId} not found`,
      );
    }
    const groups = await this.groupRepository.find({
      where: { phaseId },
      order: { groupId: 'ASC' },
    });
    return this.groupMapper.toResponseDtoList(groups);
  }

  /**
   * Retrieves a competition group.
   *
   * @param groupId - Group identifier.
   * @returns The matching group.
   */
  async findGroup(groupId: number): Promise<CompetitionGroupResponseDto> {
    const group = await this.phasesRepository.findGroup(groupId);
    if (!group) {
      throw ApplicationErrors.notFound(
        `Competition group with id ${groupId} not found`,
      );
    }
    return this.groupMapper.toResponseDto(group);
  }

  /**
   * Updates a competition group.
   *
   * @param groupId - Group identifier.
   * @param dto - Fields to update.
   * @returns The updated group.
   */
  async updateGroup(
    groupId: number,
    dto: CompetitionGroupDto,
  ): Promise<CompetitionGroupResponseDto> {
    const group = await this.phasesRepository.findGroup(groupId);
    if (!group) {
      throw ApplicationErrors.notFound(
        `Competition group with id ${groupId} not found`,
      );
    }
    if (dto.letterOrNumber !== undefined) {
      const duplicate = await this.groupRepository.findOne({
        where: {
          phaseId: group.phaseId,
          letterOrNumber: dto.letterOrNumber.trim(),
        },
      });
      if (duplicate && duplicate.groupId !== groupId) {
        throw ApplicationErrors.conflict(
          'That group identifier is already used in the phase',
        );
      }
    }
    if (
      dto.maxTeams !== undefined &&
      dto.maxTeams < (await this.phasesRepository.countGroupTeams(groupId))
    ) {
      throw ApplicationErrors.invalidInput(
        'maxTeams cannot be lower than the current team count',
      );
    }
    const saved = await this.groupRepository.save(
      this.groupMapper.mergeEntity(group, {
        ...dto,
        letterOrNumber: dto.letterOrNumber?.trim(),
      }),
    );
    return this.groupMapper.toResponseDto(saved);
  }

  /**
   * Deletes an empty competition group.
   *
   * @param groupId - Group identifier.
   * @returns Nothing when deletion succeeds.
   */
  async removeGroup(groupId: number): Promise<void> {
    const group = await this.phasesRepository.findGroup(groupId);
    if (!group) {
      throw ApplicationErrors.notFound(
        `Competition group with id ${groupId} not found`,
      );
    }
    if ((await this.phasesRepository.countGroupTeams(groupId)) > 0) {
      throw ApplicationErrors.conflict(
        'A competition group with assigned teams cannot be deleted',
      );
    }
    await this.groupRepository.remove(group);
  }

  /**
   * Assigns a team to a competition group.
   *
   * @param groupId - Group identifier.
   * @param dto - Team identifier.
   * @returns The created assignment.
   */
  async assignTeam(
    groupId: number,
    dto: AssignTeamDto,
  ): Promise<{ teamId: number; groupId: number }> {
    const group = await this.phasesRepository.findGroup(groupId);
    if (!group) {
      throw ApplicationErrors.notFound(
        `Competition group with id ${groupId} not found`,
      );
    }
    const tournament = await this.tournamentRepository.findOne({
      where: { tournamentId: group.phase.tournamentId },
      relations: { sport: true },
    });
    if (!tournament) {
      throw ApplicationErrors.notFound(
        `Tournament with id ${group.phase.tournamentId} not found`,
      );
    }
    const team = await this.teamRepository.findOne({
      where: { teamId: dto.teamId },
    });
    if (!team) {
      throw ApplicationErrors.notFound(`Team with id ${dto.teamId} not found`);
    }
    if (team.sportId !== tournament.sport.sportId) {
      throw ApplicationErrors.invalidInput(
        'The team and tournament must belong to the same sport',
      );
    }
    if (team.groupId !== undefined && team.groupId !== null) {
      throw ApplicationErrors.conflict('The team is already assigned to a group');
    }
    if (
      (await this.phasesRepository.countGroupTeams(groupId)) >= group.maxTeams
    ) {
      throw ApplicationErrors.conflict('The group capacity has been reached');
    }
    team.group = group;
    team.groupId = group.groupId;
    await this.teamRepository.save(team);
    return { teamId: team.teamId, groupId: group.groupId };
  }

  /**
   * Lists teams assigned to a competition group.
   *
   * @param groupId - Group identifier.
   * @returns The assigned teams.
   */
  async findGroupTeams(
    groupId: number,
  ): Promise<{ teamId: number; name: string; category: string }[]> {
    if (!await this.phasesRepository.findGroup(groupId)) {
      throw ApplicationErrors.notFound(
        `Competition group with id ${groupId} not found`,
      );
    }
    const teams = await this.teamRepository.find({ where: { groupId } });
    return teams.map((team) => ({
      teamId: team.teamId,
      name: team.name,
      category: team.category,
    }));
  }

  /**
   * Removes a team assignment from a competition group.
   *
   * @param groupId - Group identifier.
   * @param teamId - Team identifier.
   * @returns Nothing when removal succeeds.
   */
  async removeTeam(groupId: number, teamId: number): Promise<void> {
    const team = await this.teamRepository.findOne({
      where: { teamId, groupId },
    });
    if (!team) {
      throw ApplicationErrors.notFound('Team assignment not found');
    }
    team.group = undefined;
    team.groupId = undefined;
    await this.teamRepository.save(team);
  }
}
