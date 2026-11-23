import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AssignPlayerTeamDto } from './dto/assign-player-team.dto';
import { PlayerTeamResponseDto } from './dto/player-team-response.dto';
import { RetirePlayerTeamDto } from './dto/retire-player-team.dto';
import { PlayerTeamsService } from './player-teams.service';

@Controller()
export class PlayerTeamsController {
  constructor(private readonly playerTeamsService: PlayerTeamsService) {}

  @Post('teams/:teamId/players')
  assign(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Body() dto: AssignPlayerTeamDto,
  ): Promise<PlayerTeamResponseDto> {
    return this.playerTeamsService.assign(teamId, dto);
  }

  @Patch('teams/:teamId/players/:playerId/retirement')
  retire(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Param('playerId', ParseIntPipe) playerId: number,
    @Body() dto: RetirePlayerTeamDto,
  ): Promise<PlayerTeamResponseDto> {
    return this.playerTeamsService.retire(teamId, playerId, dto);
  }

  @Delete('player-teams/:playerTeamId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteScheduled(
    @Param('playerTeamId', ParseIntPipe) playerTeamId: number,
  ): Promise<void> {
    return this.playerTeamsService.deleteScheduled(playerTeamId);
  }

  @Get('teams/:teamId/players')
  findByTeam(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Query('current') current?: string,
  ): Promise<PlayerTeamResponseDto[]> {
    return this.playerTeamsService.findByTeam(teamId, current === 'true');
  }

  @Get('players/:playerId/teams')
  findByPlayer(
    @Param('playerId', ParseIntPipe) playerId: number,
  ): Promise<PlayerTeamResponseDto[]> {
    return this.playerTeamsService.findByPlayer(playerId);
  }
}
