import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationErrors } from '../common/errors/application-error';
import { Match } from '../matches/entities/match.entity';
import { GroupPhase } from '../phases/entities/group-phase.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { Team } from '../teams/entities/team.entity';
import { TeamSport } from '../team-sports/entities/team-sport.entity';
import { AssignTeamDto } from './dto/assign-team.dto';
import { CompetitionGroupDto } from './dto/competition-group.dto';
import { CompetitionGroupResponseDto } from './dto/competition-group-response.dto';
import { CompetitionGroup } from './entities/competition-group.entity';
import { CompetitionGroupMapper } from './mappers/competition-group.mapper';

/**
 * Service responsible for competition group CRUD and team assignments.
 */
@Injectable()
export class GroupsService {
  /**
   * Creates the groups service.
   *
   * @param groupRepository - Competition group repository.
   * @param groupPhaseRepository - Group phase repository.
   * @param teamRepository - Team repository.
   * @param tournamentRepository - Tournament repository.
   * @param matchRepository - Match repository.
   * @param teamSportRepository - Team-sport assignment repository.
   * @param groupMapper - Competition group mapper.
   */
  constructor(
    @InjectRepository(CompetitionGroup)
    private readonly groupRepository: Repository<CompetitionGroup>,
    @InjectRepository(GroupPhase)
    private readonly groupPhaseRepository: Repository<GroupPhase>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(Tournament)
    private readonly tournamentRepository: Repository<Tournament>,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(TeamSport)
    private readonly teamSportRepository: Repository<TeamSport>,
    private readonly groupMapper: CompetitionGroupMapper,
  ) {}

  /**
   * Creates a group inside a group phase.
   *
   * @param phaseId - Parent group phase identifier.
   * @param dto - Group data.
   * @returns The created group.
   */
  async create(
    phaseId: number,
    dto: CompetitionGroupDto,
  ): Promise<CompetitionGroupResponseDto> {
    const phase = await this.findGroupPhase(phaseId);
    if (!dto.letterOrNumber?.trim() || !dto.maxTeams) {
      throw ApplicationErrors.invalidInput(
        'letterOrNumber and maxTeams are required',
      );
    }
    const letterOrNumber = dto.letterOrNumber.trim();
    const existing = await this.groupRepository.findOne({
      where: { phaseId: phase.phaseId, letterOrNumber },
    });
    if (existing) {
      throw ApplicationErrors.conflict(
        'That group identifier is already used in the phase',
      );
    }
    const group = this.groupMapper.toEntity(
      { ...dto, letterOrNumber },
      phase.phaseId,
    );
    return this.groupMapper.toResponseDto(
      await this.groupRepository.save(group),
    );
  }

  /**
   * Lists groups inside a group phase.
   *
   * @param phaseId - Parent group phase identifier.
   * @returns The groups in the phase.
   */
  async findAll(phaseId: number): Promise<CompetitionGroupResponseDto[]> {
    await this.findGroupPhase(phaseId);
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
  async findOne(groupId: number): Promise<CompetitionGroupResponseDto> {
    const group = await this.findGroup(groupId);
    return this.groupMapper.toResponseDto(group);
  }

  /**
   * Updates a competition group.
   *
   * @param groupId - Group identifier.
   * @param dto - Fields to update.
   * @returns The updated group.
   */
  async update(
    groupId: number,
    dto: CompetitionGroupDto,
  ): Promise<CompetitionGroupResponseDto> {
    const group = await this.findGroup(groupId);
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
      dto.maxTeams < (await this.countAssignedTeams(groupId))
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
   * Deletes a group when no associated match or team prevents it.
   *
   * @param groupId - Group identifier.
   * @returns Nothing after deletion.
   */
  async remove(groupId: number): Promise<void> {
    const group = await this.findGroup(groupId);
    if ((await this.countAssignedTeams(groupId)) > 0) {
      throw ApplicationErrors.conflict(
        'A competition group with assigned teams cannot be deleted',
      );
    }
    const matchCount = await this.matchRepository.count({
      where: { phase: { phaseId: group.phaseId } },
    });
    if (matchCount > 0) {
      throw ApplicationErrors.conflict(
        'A competition group with associated matches cannot be deleted',
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
    const group = await this.findGroup(groupId);
    const phase = await this.findGroupPhase(group.phaseId);
    const tournament = await this.tournamentRepository.findOne({
      where: { tournamentId: phase.tournamentId },
      relations: { sport: true },
    });
    if (!tournament) {
      throw ApplicationErrors.notFound(
        `Tournament with id ${phase.tournamentId} not found`,
      );
    }
    const team = await this.teamRepository.findOne({
      where: { teamId: dto.teamId },
    });
    if (!team) {
      throw ApplicationErrors.notFound(`Team with id ${dto.teamId} not found`);
    }
    const teamSport = await this.teamSportRepository.findOne({
      where: {
        team: { teamId: team.teamId },
        sport: { sportId: tournament.sport.sportId },
      },
    });
    if (!teamSport) {
      throw ApplicationErrors.invalidInput(
        'The team and tournament must belong to the same sport',
      );
    }
    if (team.groupId !== undefined && team.groupId !== null) {
      throw ApplicationErrors.conflict(
        'The team is already assigned to a group in this phase',
      );
    }
    if ((await this.countAssignedTeams(groupId)) >= group.maxTeams) {
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
   * @returns Assigned teams.
   */
  async findTeams(
    groupId: number,
  ): Promise<{ teamId: number; name: string; category: string }[]> {
    await this.findGroup(groupId);
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
   * @returns Nothing after removal.
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

  /**
   * Finds a group phase.
   *
   * @param phaseId - Group phase identifier.
   * @returns The matching group phase.
   */
  private async findGroupPhase(phaseId: number): Promise<GroupPhase> {
    const phase = await this.groupPhaseRepository.findOne({
      where: { phaseId },
    });
    if (!phase) {
      throw ApplicationErrors.notFound(
        `Group phase with id ${phaseId} not found`,
      );
    }
    return phase;
  }

  /**
   * Finds a competition group.
   *
   * @param groupId - Group identifier.
   * @returns The matching group.
   */
  private async findGroup(groupId: number): Promise<CompetitionGroup> {
    const group = await this.groupRepository.findOne({
      where: { groupId },
      relations: { phase: true },
    });
    if (!group) {
      throw ApplicationErrors.notFound(
        `Competition group with id ${groupId} not found`,
      );
    }
    return group;
  }

  /**
   * Counts teams assigned to a group.
   *
   * @param groupId - Group identifier.
   * @returns Number of assigned teams.
   */
  private async countAssignedTeams(groupId: number): Promise<number> {
    return this.teamRepository.count({ where: { groupId } });
  }
}
