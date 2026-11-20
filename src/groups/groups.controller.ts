import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { AssignTeamDto } from './dto/assign-team.dto';
import { CompetitionGroupDto } from './dto/competition-group.dto';
import { CompetitionGroupResponseDto } from './dto/competition-group-response.dto';
import { GroupsService } from './groups.service';

/**
 * HTTP endpoints for competition group management.
 */
@Controller('api')
export class GroupsController {
  /**
   * Creates the groups controller.
   *
   * @param groupsService - Groups service.
   */
  constructor(private readonly groupsService: GroupsService) {}

  /** Creates a group in a group phase. */
  @Post('phases/:phaseId/groups')
  create(
    @Param('phaseId', ParseIntPipe) phaseId: number,
    @Body() dto: CompetitionGroupDto,
  ): Promise<CompetitionGroupResponseDto> {
    return this.groupsService.create(phaseId, dto);
  }

  /** Lists the groups in a group phase. */
  @Get('phases/:phaseId/groups')
  findAll(
    @Param('phaseId', ParseIntPipe) phaseId: number,
  ): Promise<CompetitionGroupResponseDto[]> {
    return this.groupsService.findAll(phaseId);
  }

  /** Retrieves a group. */
  @Get('groups/:groupId')
  findOne(
    @Param('groupId', ParseIntPipe) groupId: number,
  ): Promise<CompetitionGroupResponseDto> {
    return this.groupsService.findOne(groupId);
  }

  /** Updates a group. */
  @Patch('groups/:groupId')
  update(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() dto: CompetitionGroupDto,
  ): Promise<CompetitionGroupResponseDto> {
    return this.groupsService.update(groupId, dto);
  }

  /** Deletes a group when no associated information prevents it. */
  @Delete('groups/:groupId')
  async remove(
    @Param('groupId', ParseIntPipe) groupId: number,
  ): Promise<void> {
    await this.groupsService.remove(groupId);
  }

  /** Assigns a team to a group. */
  @Post('groups/:groupId/teams')
  assignTeam(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() dto: AssignTeamDto,
  ): Promise<{ teamId: number; groupId: number }> {
    return this.groupsService.assignTeam(groupId, dto);
  }

  /** Lists teams assigned to a group. */
  @Get('groups/:groupId/teams')
  findTeams(
    @Param('groupId', ParseIntPipe) groupId: number,
  ): Promise<{ teamId: number; name: string; category: string }[]> {
    return this.groupsService.findTeams(groupId);
  }

  /** Removes a team assignment from a group. */
  @Delete('groups/:groupId/teams/:teamId')
  async removeTeam(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('teamId', ParseIntPipe) teamId: number,
  ): Promise<void> {
    await this.groupsService.removeTeam(groupId, teamId);
  }
}
