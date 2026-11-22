import { jest } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { Team } from '../teams/entities/team.entity';
import { TeamSport } from '../team-sports/entities/team-sport.entity';
import { TeamSportMapper } from '../team-sports/mappers/team-sport.mapper';
import { Sport } from './entities/sport.entity';
import { SportMapper } from './mappers/sport.mapper';
import { SportsController } from './sports.controller';
import { SportsRepository } from './repositories/sports.repository';
import { SportsService } from './sports.service';

describe('SportsController team-sport relationships', () => {
  let app: INestApplication<App>;
  const sportRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const sportsRepository = {
    existsByName: jest.fn(),
  };

  const createSportWithAssignment = (): Sport => {
    const assignment = Object.assign(new TeamSport(), {
      teamSportId: 8,
      team: Object.assign(new Team(), { teamId: 12 }),
      sport: Object.assign(new Sport(), { sportId: 5 }),
    });
    return Object.assign(new Sport(), {
      sportId: 5,
      name: 'Basketball',
      description: 'Court sport',
      teamSports: [assignment],
    });
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const sport = createSportWithAssignment();
    sportRepository.find.mockResolvedValue([sport]);
    sportRepository.findOne.mockResolvedValue(sport);
    sportRepository.save.mockResolvedValue(sport);
    sportsRepository.existsByName.mockResolvedValue(false);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SportsController],
      providers: [
        SportsService,
        SportMapper,
        TeamSportMapper,
        {
          provide: getRepositoryToken(Sport),
          useValue: sportRepository,
        },
        {
          provide: SportsRepository,
          useValue: sportsRepository,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns team and sport IDs from GET /api/sports when assignments exist', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/sports')
      .expect(200);

    expect(response.body[0].teamSports).toEqual([
      { teamSportId: 8, teamId: 12, sportId: 5 },
    ]);
    expect(sportRepository.find).toHaveBeenCalledWith({
      relations: {
        parentSport: true,
        teamSports: { team: true, sport: true },
      },
    });
  });

  it('loads assignment relations when reading and updating a sport', async () => {
    const readResponse = await request(app.getHttpServer())
      .get('/api/sports/5')
      .expect(200);
    expect(readResponse.body.teamSports).toEqual([
      { teamSportId: 8, teamId: 12, sportId: 5 },
    ]);

    const updateResponse = await request(app.getHttpServer())
      .patch('/api/sports/5')
      .send({ name: 'Updated Basketball' })
      .expect(200);
    expect(updateResponse.body.teamSports).toEqual([
      { teamSportId: 8, teamId: 12, sportId: 5 },
    ]);
    expect(sportRepository.findOne).toHaveBeenCalledWith({
      where: { sportId: 5 },
      relations: {
        parentSport: true,
        teamSports: { team: true, sport: true },
      },
    });
  });
});
