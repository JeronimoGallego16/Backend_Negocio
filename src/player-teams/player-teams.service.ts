import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationErrors } from '../common/errors/application-error';
import { TeamsService } from '../teams/teams.service';
import { AssignPlayerTeamDto } from './dto/assign-player-team.dto';
import { PlayerTeamResponseDto } from './dto/player-team-response.dto';
import { RetirePlayerTeamDto } from './dto/retire-player-team.dto';
import { PlayerTeam } from './entities/player-team.entity';
import { PlayerTeamMapper } from './mappers/player-team.mapper';
import { PlayerTeamsRepository } from './repositories/player-teams.repository';
import { PlayersService } from '../players/players.service';

@Injectable()
export class PlayerTeamsService {
  constructor(
    @InjectRepository(PlayerTeam)
    private readonly playerTeamRepository: Repository<PlayerTeam>,
    private readonly playerTeamsRepository: PlayerTeamsRepository,
    private readonly playersService: PlayersService,
    private readonly teamsService: TeamsService,
    private readonly playerTeamMapper: PlayerTeamMapper,
  ) {}

  async assign(
    teamId: number,
    dto: AssignPlayerTeamDto,
  ): Promise<PlayerTeamResponseDto> {
    if (dto.playerId === undefined || !dto.startDate) {
      throw ApplicationErrors.invalidInput(
        'playerId and startDate are required for assignment',
      );
    }

    if (dto.endDate !== undefined && dto.endDate < dto.startDate) {
      throw ApplicationErrors.invalidInput(
        'endDate cannot be earlier than startDate',
      );
    }

    await this.playersService.findOne(dto.playerId);
    await this.teamsService.findOne(teamId);

    const overlaps = await this.playerTeamsRepository.findOverlapping(
      dto.playerId,
      dto.startDate,
      dto.endDate ?? null,
    );

    if (overlaps.some((assignment) => assignment.teamId === teamId)) {
      throw ApplicationErrors.conflict(
        'The player is already assigned to this team in that period',
      );
    }

    let previous: PlayerTeam | null = null;
    if (overlaps.length > 0) {
      if (
        overlaps.length === 1 &&
        overlaps[0].endDate === null &&
        overlaps[0].startDate < dto.startDate
      ) {
        previous = overlaps[0];
        previous.endDate = dto.startDate;
      } else {
        throw ApplicationErrors.conflict(
          'The player already has a team in that period',
        );
      }
    }

    const next = this.playerTeamMapper.toEntity(teamId, dto);
    const saved = await this.playerTeamsRepository.saveClosingPrevious(
      previous,
      next,
    );
    return this.playerTeamMapper.toResponseDto(saved);
  }

  async retire(
    teamId: number,
    playerId: number,
    dto: RetirePlayerTeamDto,
  ): Promise<PlayerTeamResponseDto> {
    if (!dto.endDate) {
      throw ApplicationErrors.invalidInput(
        'endDate is required for retirement',
      );
    }

    const assignment = await this.playerTeamsRepository.findOpenLink(
      playerId,
      teamId,
    );
    if (!assignment) {
      throw ApplicationErrors.notFound(
        'The player has no open assignment with this team',
      );
    }

    if (dto.endDate < assignment.startDate) {
      throw ApplicationErrors.invalidInput(
        'endDate cannot be earlier than startDate',
      );
    }

    assignment.endDate = dto.endDate;
    const saved = await this.playerTeamRepository.save(assignment);
    return this.playerTeamMapper.toResponseDto(saved);
  }

  async findByPlayer(playerId: number): Promise<PlayerTeamResponseDto[]> {
    await this.playersService.findOne(playerId);
    const assignments = await this.playerTeamsRepository.findByPlayer(playerId);
    return this.playerTeamMapper.toResponseDtoList(assignments);
  }

  async findByTeam(
    teamId: number,
    onlyCurrent: boolean,
  ): Promise<PlayerTeamResponseDto[]> {
    await this.teamsService.findOne(teamId);
    const today = onlyCurrent
      ? new Date().toISOString().slice(0, 10)
      : undefined;
    const assignments = await this.playerTeamsRepository.findByTeam(
      teamId,
      today,
    );
    return this.playerTeamMapper.toResponseDtoList(assignments);
  }

  belongsToTeam(
    playerId: number,
    teamId: number,
    onDate: string,
  ): Promise<boolean> {
    return this.playerTeamsRepository.belongsToTeam(playerId, teamId, onDate);
  }
}
