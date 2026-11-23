import { jest } from '@jest/globals';
import { MoreThan, Repository } from 'typeorm';
import { PlayerTeam } from '../entities/player-team.entity';
import { PlayerTeamsRepository } from './player-teams.repository';

describe('PlayerTeamsRepository scheduled deletion', () => {
  it('deletes by id only when the start date is after today', async () => {
    const deleteRow = jest.fn(async () => ({ affected: 1, raw: [] }));
    const repository = new PlayerTeamsRepository({
      delete: deleteRow,
    } as unknown as Repository<PlayerTeam>);

    await expect(repository.deleteScheduled(42, '2026-11-23')).resolves.toBe(true);
    expect(deleteRow).toHaveBeenCalledWith({
      playerTeamId: 42,
      startDate: MoreThan('2026-11-23'),
    });
  });
});
