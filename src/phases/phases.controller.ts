import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AssignTeamDto } from './dto/assign-team.dto';
import { CompetitionGroupDto } from './dto/competition-group.dto';
import { CompetitionGroupResponseDto } from './dto/competition-group-response.dto';
import { PhaseDto } from './dto/phase.dto';
import { PhaseResponseDto } from './dto/phase-response.dto';
import { PhasesService } from './phases.service';

/**
 * HTTP endpoints for tournament phases, groups and team assignments.
 */
@Controller('api/phases')
export class PhasesController {
  /**
   * Creates the phases controller.
   *
   * @param phasesService - Service handling phases and groups.
   */
  constructor(private readonly phasesService: PhasesService) {}

  /**
   * Creates a group phase or final phase.
   *
   * @param dto - Phase data.
   * @returns The created phase.
   */
  @Post()
  create(@Body() dto: PhaseDto): Promise<PhaseResponseDto> {
    return this.phasesService.create(dto);
  }

  /**
   * Lists phases with an optional tournament filter.
   *
   * @param tournamentId - Optional tournament filter.
   * @returns Matching phases.
   */
  @Get()
  findAll(
    @Query('tournamentId') tournamentId?: string,
  ): Promise<PhaseResponseDto[]> {
    return this.phasesService.findAll(
      tournamentId === undefined ? undefined : Number(tournamentId),
    );
  }

  /**
   * Creates a competition group inside a group phase.
   *
   * @param phaseId - Parent group phase identifier.
   * @param dto - Group data.
   * @returns The created group.
   */
  @Post(':phaseId/groups')
  createGroup(
    @Param('phaseId', ParseIntPipe) phaseId: number,
    @Body() dto: CompetitionGroupDto,
  ): Promise<CompetitionGroupResponseDto> {
    return this.phasesService.createGroup(phaseId, dto);
  }

  /**
   * Lists groups inside a group phase.
   *
   * @param phaseId - Parent group phase identifier.
   * @returns The groups in the phase.
   */
  @Get(':phaseId/groups')
  findGroups(
    @Param('phaseId', ParseIntPipe) phaseId: number,
  ): Promise<CompetitionGroupResponseDto[]> {
    return this.phasesService.findGroups(phaseId);
  }

  /**
   * Retrieves a competition group.
   *
   * @param groupId - Group identifier.
   * @returns The matching group.
   */
  @Get('groups/:groupId')
  findGroup(
    @Param('groupId', ParseIntPipe) groupId: number,
  ): Promise<CompetitionGroupResponseDto> {
    return this.phasesService.findGroup(groupId);
  }

  /**
   * Updates a competition group.
   *
   * @param groupId - Group identifier.
   * @param dto - Group fields to update.
   * @returns The updated group.
   */
  @Patch('groups/:groupId')
  updateGroup(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() dto: CompetitionGroupDto,
  ): Promise<CompetitionGroupResponseDto> {
    return this.phasesService.updateGroup(groupId, dto);
  }

  /**
   * Deletes an empty competition group.
   *
   * @param groupId - Group identifier.
   * @returns Nothing when deletion succeeds.
   */
  @Delete('groups/:groupId')
  async removeGroup(@Param('groupId', ParseIntPipe) groupId: number): Promise<void> {
    await this.phasesService.removeGroup(groupId);
  }

  /**
   * Assigns a team to a competition group.
   *
   * @param groupId - Group identifier.
   * @param dto - Team identifier.
   * @returns The created assignment.
   */
  @Post('groups/:groupId/teams')
  assignTeam(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() dto: AssignTeamDto,
  ): Promise<{ teamId: number; groupId: number }> {
    return this.phasesService.assignTeam(groupId, dto);
  }

  /**
   * Lists teams assigned to a competition group.
   *
   * @param groupId - Group identifier.
   * @returns Team assignments.
   */
  @Get('groups/:groupId/teams')
  findGroupTeams(
    @Param('groupId', ParseIntPipe) groupId: number,
  ): Promise<{ teamId: number; name: string; category: string }[]> {
    return this.phasesService.findGroupTeams(groupId);
  }

  /**
   * Removes a team assignment from a competition group.
   *
   * @param groupId - Group identifier.
   * @param teamId - Team identifier.
   * @returns Nothing when removal succeeds.
   */
  @Delete('groups/:groupId/teams/:teamId')
  async removeTeam(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('teamId', ParseIntPipe) teamId: number,
  ): Promise<void> {
    await this.phasesService.removeTeam(groupId, teamId);
  }

  /**
   * Retrieves a phase by identifier.
   *
   * @param id - Phase identifier.
   * @returns The matching phase.
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<PhaseResponseDto> {
    return this.phasesService.findOne(id);
  }

  /**
   * Updates a phase.
   *
   * @param id - Phase identifier.
   * @param dto - Fields to update.
   * @returns The updated phase.
   */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PhaseDto,
  ): Promise<PhaseResponseDto> {
    return this.phasesService.update(id, dto);
  }

  /**
   * Deletes a phase when no associated information prevents it.
   *
   * @param id - Phase identifier.
   * @returns Nothing when deletion succeeds.
   */
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.phasesService.remove(id);
  }
}
