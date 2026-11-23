import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, RequestMethod } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api', {
      exclude: [{ path: '/', method: RequestMethod.ALL }],
    });
    await app.init();
  });

  it('/ (GET) requires authentication', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(401)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          statusCode: 401,
          message: 'Token de autorizacion faltante',
          error: 'Unauthorized',
        });
      });
  });

  it('registers the business and player-domain routes', async () => {
    const probes = [
      () => request(app.getHttpServer()).get('/api/teams'),
      () => request(app.getHttpServer()).get('/api/sports'),
      () => request(app.getHttpServer()).get('/api/team-sports'),
      () => request(app.getHttpServer()).get('/api/matches'),
      () => request(app.getHttpServer()).get('/api/tournaments'),
      () => request(app.getHttpServer()).get('/api/registrations'),
      () => request(app.getHttpServer()).get('/api/phases'),
      () => request(app.getHttpServer()).post('/api/players'),
      () => request(app.getHttpServer()).get('/api/players'),
      () => request(app.getHttpServer()).get('/api/players/1/profile'),
      () => request(app.getHttpServer()).get('/api/players/1'),
      () => request(app.getHttpServer()).patch('/api/players/1'),
      () => request(app.getHttpServer()).delete('/api/players/1'),
      () => request(app.getHttpServer()).post('/api/skills'),
      () => request(app.getHttpServer()).get('/api/skills'),
      () => request(app.getHttpServer()).get('/api/skills/1'),
      () => request(app.getHttpServer()).patch('/api/skills/1'),
      () => request(app.getHttpServer()).delete('/api/skills/1'),
      () => request(app.getHttpServer()).post('/api/players/1/skills'),
      () => request(app.getHttpServer()).get('/api/players/1/skills'),
      () => request(app.getHttpServer()).patch('/api/players/1/skills/1'),
      () => request(app.getHttpServer()).delete('/api/players/1/skills/1'),
      () => request(app.getHttpServer()).get('/api/skills/1/players'),
      () => request(app.getHttpServer()).post('/api/teams/1/players'),
      () => request(app.getHttpServer()).get('/api/teams/1/players'),
      () => request(app.getHttpServer()).patch('/api/teams/1/players/1/retirement'),
      () => request(app.getHttpServer()).delete('/api/player-teams/1'),
      () => request(app.getHttpServer()).get('/api/players/1/teams'),
      () => request(app.getHttpServer()).post('/api/matches/1/annotations'),
      () => request(app.getHttpServer()).get('/api/matches/1/annotations'),
      () => request(app.getHttpServer()).patch('/api/annotations/1'),
      () => request(app.getHttpServer()).delete('/api/annotations/1'),
    ];

    for (const probe of probes) {
      await probe().expect(401);
    }
  });

  afterEach(async () => {
    await app.close();
  });
});
