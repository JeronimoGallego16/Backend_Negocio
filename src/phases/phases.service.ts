import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationErrors } from '../common/errors/application-error';
import { Team } from '../teams/entities/team.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { AssignTeamDto } from './dto/assign-team.dto';
import { PhaseDto } from './dto/phase.dto';
import { PhaseResponseDto } from './dto/phase-response.dto';
import { Group } from './entities/group.entity';
import { Phase } from './entities/phase.entity';
import { PhaseMapper } from './mappers/phase.mapper';
import { PhasesRepository } from './repositories/phases.repository';

/**
 * Business logic for tournament phases and group-team assignments.
 */
@Injectable()
export class PhasesService {
  /**
   * Creates the phases service.
   *
   * @param phaseRepository - Repository for phases.
   * @param tournamentRepository - Repository for tournaments.
   * @param teamRepository - Repository for teams.
   * @param phasesRepository - Repository for phase-specific queries.
   * @param phaseMapper - Mapper for phases.
   */
  constructor(
    @InjectRepository(Phase)
    private readonly phaseRepository: Repository<Phase>,
    @InjectRepository(Tournament)
    private readonly tournamentRepository: Repository<Tournament>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    private readonly phasesRepository: PhasesRepository,
    private readonly phaseMapper: PhaseMapper,
  ) {}

  /**
   * Creates a group or final phase.
   *
   * @param dto - Phase data.
   * @returns The created phase.
   */
  async create(dto: PhaseDto): Promise<PhaseResponseDto> {
    if (!dto.name?.trim() || !dto.order || !dto.tournamentId || !dto.type) {
      throw ApplicationErrors.invalidInput('name, order, tournamentId and type are required');
    }
    const tournament = await this.tournamentRepository.findOne({
      where: { tournamentId: dto.tournamentId },
    });
    if (!tournament) {
      throw ApplicationErrors.notFound(`Tournament with id ${dto.tournamentId} not found`);
    }
    if (await this.phasesRepository.existsOrder(dto.tournamentId, dto.order)) {
      throw ApplicationErrors.conflict('That phase order is already used in the tournament');
    }
    if (dto.type === 'GROUP' && (!dto.letterOrNumber?.trim() || !dto.maxTeams)) {
      throw ApplicationErrors.invalidInput('letterOrNumber and maxTeams are required for a group');
    }
    const phase = this.phaseMapper.toEntity(dto);
    phase.tournamentId = tournament.tournamentId;
    return this.phaseMapper.toResponseDto(await this.phaseRepository.save(phase));
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
    const phase = await this.phaseRepository.findOne({
      where: { phaseId },
    });
    if (!phase) throw ApplicationErrors.notFound(`Phase with id ${phaseId} not found`);
    return this.phaseMapper.toResponseDto(phase);
  }

  /**
   * Updates a phase.
   *
   * @param phaseId - Phase identifier.
   * @param dto - Fields to update.
   * @returns The updated phase.
   */
  async update(phaseId: number, dto: PhaseDto): Promise<PhaseResponseDto> {
    const phase = await this.phaseRepository.findOne({
      where: { phaseId },
    });
    if (!phase) throw ApplicationErrors.notFound(`Phase with id ${phaseId} not found`);
    if (dto.order !== undefined && await this.phasesRepository.existsOrder(
      phase.tournamentId,
      dto.order,
      phaseId,
    )) {
      throw ApplicationErrors.conflict('That phase order is already used in the tournament');
    }
    const merged = this.phaseMapper.mergeEntity(phase, dto);
    if (merged instanceof Group && (!merged.letterOrNumber?.trim() || !merged.maxTeams)) {
      throw ApplicationErrors.invalidInput('letterOrNumber and maxTeams are required for a group');
    }
    return this.phaseMapper.toResponseDto(await this.phaseRepository.save(merged));
  }

  /**
   * Deletes a phase only when it has no matches or group assignments.
   *
   * @param phaseId - Phase identifier.
   * @returns Nothing when deletion succeeds.
   */
  async remove(phaseId: number): Promise<void> {
    const phase = await this.phaseRepository.findOne({ where: { phaseId } });
    if (!phase) throw ApplicationErrors.notFound(`Phase with id ${phaseId} not found`);
    if (await this.phasesRepository.hasMatches(phaseId)) {
      throw ApplicationErrors.conflict('A phase with matches cannot be deleted');
    }
    if (phase instanceof Group && await this.phasesRepository.countGroupTeams(phaseId) > 0) {
      throw ApplicationErrors.conflict('A group with assigned teams cannot be deleted');
    }
    await this.phaseRepository.remove(phase);
  }

  /**
   * Assigns a team to a group.
   *
   * @param groupId - Group identifier.
   * @param dto - Team identifier.
   * @returns The created assignment.
   */
  async assignTeam(groupId: number, dto: AssignTeamDto): Promise<{ teamId: number; groupId: number }> {
    const group = await this.phasesRepository.findGroup(groupId);
    if (!group) throw ApplicationErrors.notFound(`Group with id ${groupId} not found`);
    const tournament = await this.tournamentRepository.findOne({
      where: { tournamentId: group.tournamentId },
      relations: { sport: true },
    });
    if (!tournament) {
      throw ApplicationErrors.notFound(`Tournament with id ${group.tournamentId} not found`);
    }
    const team = await this.teamRepository.findOne({ where: { teamId: dto.teamId } });
    if (!team) throw ApplicationErrors.notFound(`Team with id ${dto.teamId} not found`);
    if (team.sportId !== tournament.sport.sportId) {
      throw ApplicationErrors.invalidInput('The team and tournament must belong to the same sport');
    }
    if (team.groupId !== undefined) {
      throw ApplicationErrors.conflict('The team is already assigned to a group');
    }
    if (await this.phasesRepository.countGroupTeams(groupId) >= group.maxTeams) {
      throw ApplicationErrors.conflict('The group capacity has been reached');
    }
    team.group = group;
    team.groupId = group.phaseId;
    await this.teamRepository.save(team);
    return { teamId: team.teamId, groupId: group.phaseId };
  }

  /**
   * Lists teams assigned to a group.
   *
   * @param groupId - Group identifier.
   * @returns Group-team assignments.
   */
  async findGroupTeams(groupId: number): Promise<{ teamId: number; name: string; category: string }[]> {
    if (!await this.phasesRepository.findGroup(groupId)) {
      throw ApplicationErrors.notFound(`Group with id ${groupId} not found`);
    }
    const teams = await this.teamRepository.find({
      where: { groupId },
    });
    return teams.map((team) => ({
      teamId: team.teamId,
      name: team.name,
      category: team.category,
    }));
  }

  /**
   * Removes a team assignment from a group.
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
