import { jest } from '@jest/globals';
import { Repository } from 'typeorm';
import { CompetitionGroup } from '../groups/entities/competition-group.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { FinalPhase } from './entities/final.entity';
import { GroupPhase } from './entities/group-phase.entity';
import { Phase } from './entities/phase.entity';
import { PhaseMapper } from './mappers/phase.mapper';
import { PhasesRepository } from './repositories/phases.repository';
import { PhasesService } from './phases.service';

function createService() {
  const phases: Phase[] = [];
  const phaseRepository = {
    find: jest.fn(() => Promise.resolve(phases)),
    save: jest.fn((phase: Phase) => {
      phases.push(phase);
      return Promise.resolve(phase);
    }),
  } as unknown as Repository<Phase>;
  const phasesRepository = {
    existsOrder: jest.fn((_tournamentId: number, order: number) =>
      Promise.resolve(phases.some((phase) => phase.order === order)),
    ),
  } as unknown as PhasesRepository;
  const tournamentRepository = {
    findOne: jest.fn(() => Promise.resolve({ tournamentId: 10 })),
  } as unknown as Repository<Tournament>;
  const service = new PhasesService(
    phaseRepository,
    {} as Repository<CompetitionGroup>,
    tournamentRepository,
    phasesRepository,
    new PhaseMapper(),
  );
  return { service, phases };
}

describe('PhasesService final-round setup', () => {
  it('requires phase orders to start at one and remain consecutive', async () => {
    const { service } = createService();

    await expect(
      service.create({
        name: 'Semifinals',
        order: 2,
        tournamentId: 10,
        type: 'FINAL',
        expectedMatchCount: 2,
      }),
    ).rejects.toThrow('next available order is 1');
  });

  it('allows the first final round after the tournament has phases at lower orders', async () => {
    const { service, phases } = createService();
    phases.push(
      Object.assign(new GroupPhase(), {
        phaseId: 1,
        tournamentId: 10,
        name: 'Groups',
        order: 1,
      }),
    );

    await expect(
      service.create({
        name: 'Quarterfinals',
        order: 2,
        tournamentId: 10,
        type: 'FINAL',
        expectedMatchCount: 8,
      }),
    ).resolves.toMatchObject({
      order: 2,
      type: 'FINAL',
      expectedMatchCount: 8,
    });
  });

  it('requires each later final round to halve the previous final round', async () => {
    const { service, phases } = createService();
    phases.push(
      Object.assign(new FinalPhase(), {
        phaseId: 1,
        tournamentId: 10,
        name: 'Quarterfinals',
        order: 1,
        expectedMatchCount: 8,
        isThirdPlace: false,
      }),
    );

    await expect(
      service.create({
        name: 'Semifinals',
        order: 2,
        tournamentId: 10,
        type: 'FINAL',
        expectedMatchCount: 2,
      }),
    ).rejects.toThrow('exactly half the main matches');
  });

  it('requires a bracket match count that can halve down to one final match', async () => {
    const { service, phases } = createService();
    phases.push(
      Object.assign(new GroupPhase(), {
        phaseId: 1,
        tournamentId: 10,
        name: 'Groups',
        order: 1,
      }),
    );

    await expect(
      service.create({
        name: 'Initial finals',
        order: 2,
        tournamentId: 10,
        type: 'FINAL',
        expectedMatchCount: 3,
      }),
    ).rejects.toThrow('must be a power of two');
  });
});
