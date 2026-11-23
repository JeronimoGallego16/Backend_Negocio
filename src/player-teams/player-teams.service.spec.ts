import { jest } from '@jest/globals';
import { Repository } from 'typeorm';
import {
  ApplicationErrorCode,
} from '../common/errors/application-error';
import { PlayersService } from '../players/players.service';
import { TeamsService } from '../teams/teams.service';
import { PlayerTeamResponseDto } from './dto/player-team-response.dto';
import { PlayerTeam } from './entities/player-team.entity';
import { PlayerTeamMapper } from './mappers/player-team.mapper';
import { PlayerTeamsRepository } from './repositories/player-teams.repository';
import { PlayerTeamsService } from './player-teams.service';

function dateOffset(offset: number): string {
  return new Date(Date.now() + offset * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

function assignment(
  teamId: number,
  startDate: string,
  endDate: string | null,
): PlayerTeam {
  return Object.assign(new PlayerTeam(), {
    playerTeamId: 1,
    playerId: 4,
    teamId,
    startDate,
    endDate,
  });
}

function createHarness(initialRows: PlayerTeam[] = []) {
  const rows = [...initialRows];
  const playerTeamRepository = {
    save: jest.fn(async (entity: PlayerTeam) => entity),
  };
  const playerTeamsRepository = {
    deleteScheduled: jest.fn(async (playerTeamId: number, today: string) => {
      const index = rows.findIndex(
        (row) => row.playerTeamId === playerTeamId && row.startDate > today,
      );
      if (index < 0) return false;
      rows.splice(index, 1);
      return true;
    }),
    findCurrentLink: jest.fn(
      async (playerId: number, teamId: number, onDate: string) =>
        rows.find(
          (row) =>
            row.playerId === playerId &&
            row.teamId === teamId &&
            row.startDate <= onDate &&
            (row.endDate === null || row.endDate > onDate),
        ) ?? null,
    ),
    findOverlapping: jest.fn(
      async (playerId: number, startDate: string, endDate: string | null) =>
        rows.filter(
          (row) =>
            row.playerId === playerId &&
            (endDate === null || row.startDate < endDate) &&
            (row.endDate === null || row.endDate > startDate),
        ),
    ),
    saveClosingPrevious: jest.fn(
      async (_previous: PlayerTeam | null, next: PlayerTeam) => {
        next.playerTeamId = rows.length + 1;
        rows.push(next);
        return next;
      },
    ),
  };
  const mapper = {
    toEntity: jest.fn((teamId: number, dto: {
      playerId?: number;
      startDate?: string;
      endDate?: string;
    }) =>
      Object.assign(new PlayerTeam(), {
        teamId,
        playerId: dto.playerId,
        startDate: dto.startDate,
        endDate: dto.endDate ?? null,
      }),
    ),
    toResponseDto: jest.fn(
      (entity: PlayerTeam) => entity as unknown as PlayerTeamResponseDto,
    ),
  };
  const playersService = { findOne: jest.fn(async () => ({})) };
  const teamsService = { findOne: jest.fn(async () => ({})) };
  const service = new PlayerTeamsService(
    playerTeamRepository as unknown as Repository<PlayerTeam>,
    playerTeamsRepository as unknown as PlayerTeamsRepository,
    playersService as unknown as PlayersService,
    teamsService as unknown as TeamsService,
    mapper as unknown as PlayerTeamMapper,
  );

  return { service, rows, playerTeamRepository, playerTeamsRepository };
}

describe('PlayerTeamsService retirement', () => {
  const today = dateOffset(0);

  it('closes an open link and keeps its history row', async () => {
    const current = assignment(9, dateOffset(-10), null);
    const { service, rows, playerTeamsRepository, playerTeamRepository } =
      createHarness([current]);

    await service.retire(9, 4, { endDate: today });

    expect(playerTeamsRepository.findCurrentLink).toHaveBeenCalledWith(
      4,
      9,
      today,
    );
    expect(playerTeamRepository.save).toHaveBeenCalledWith(current);
    expect(rows).toEqual([current]);
    expect(current.endDate).toBe(today);
  });

  describe('PlayerTeamsService scheduled deletion', () => {
    it('deletes only the selected future period', async () => {
      const future = assignment(9, dateOffset(5), null);
      future.playerTeamId = 2;
      const current = assignment(9, dateOffset(-5), dateOffset(5));
      const { service, rows, playerTeamsRepository } = createHarness([
        current,
        future,
      ]);

      await service.deleteScheduled(2);

      expect(playerTeamsRepository.deleteScheduled).toHaveBeenCalledWith(
        2,
        dateOffset(0),
      );
      expect(rows).toEqual([current]);
    });

    it.each([dateOffset(-1), dateOffset(0)])(
      'does not delete an assignment that started on %s',
      async (startDate) => {
        const existing = assignment(9, startDate, null);
        const { service, rows } = createHarness([existing]);

        await expect(service.deleteScheduled(1)).rejects.toMatchObject({
          code: ApplicationErrorCode.NOT_FOUND,
          message: 'Scheduled assignment not found',
        });
        expect(rows).toEqual([existing]);
      },
    );

    it('returns not found for a missing assignment', async () => {
      const { service } = createHarness();
      await expect(service.deleteScheduled(999)).rejects.toMatchObject({
        code: ApplicationErrorCode.NOT_FOUND,
      });
    });
  });

  it('shortens a current link that already has a future end date', async () => {
    const current = assignment(9, dateOffset(-10), dateOffset(5));
    const { service, playerTeamRepository } = createHarness([current]);

    await service.retire(9, 4, { endDate: today });

    expect(playerTeamRepository.save).toHaveBeenCalledWith(current);
    expect(current.endDate).toBe(today);
  });

  it('returns not found when the assignment has already ended', async () => {
    const ended = assignment(9, dateOffset(-10), dateOffset(-1));
    const { service } = createHarness([ended]);

    await expect(service.retire(9, 4, { endDate: today })).rejects.toMatchObject({
      code: ApplicationErrorCode.NOT_FOUND,
      message: 'The player has no current assignment with this team',
    });
  });

  it('rejects an end date before the assignment start date', async () => {
    const current = assignment(9, today, null);
    const { service } = createHarness([current]);

    await expect(
      service.retire(9, 4, { endDate: dateOffset(-1) }),
    ).rejects.toMatchObject({
      code: ApplicationErrorCode.INVALID_INPUT,
      message: 'endDate cannot be earlier than startDate',
    });
  });

  it('rejects an end date later than the existing end date', async () => {
    const current = assignment(9, dateOffset(-10), dateOffset(5));
    const { service } = createHarness([current]);

    await expect(
      service.retire(9, 4, { endDate: dateOffset(6) }),
    ).rejects.toMatchObject({
      code: ApplicationErrorCode.INVALID_INPUT,
      message: 'endDate cannot be later than the current endDate',
    });
  });

  it('requires an end date before looking up the current assignment', async () => {
    const { service, playerTeamsRepository } = createHarness();

    await expect(service.retire(9, 4, {})).rejects.toMatchObject({
      code: ApplicationErrorCode.INVALID_INPUT,
      message: 'endDate is required for retirement',
    });
    expect(playerTeamsRepository.findCurrentLink).not.toHaveBeenCalled();
  });

  it('allows another team and a later period with the same team after retirement', async () => {
    const previous = assignment(9, dateOffset(-10), null);
    const { service, rows } = createHarness([previous]);

    await service.retire(9, 4, { endDate: today });
    await service.assign(10, { playerId: 4, startDate: today });
    await service.retire(10, 4, { endDate: dateOffset(1) });
    await service.assign(9, { playerId: 4, startDate: dateOffset(1) });

    expect(rows).toHaveLength(3);
    expect(rows[0].endDate).toBe(today);
    expect(rows[1].teamId).toBe(10);
    expect(rows[1].endDate).toBe(dateOffset(1));
    expect(rows[2].teamId).toBe(9);
    expect(rows[2].startDate).toBe(dateOffset(1));
  });
});
