import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
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

  it('registers the player-domain routes', async () => {
    const probes = [
      () => request(app.getHttpServer()).post('/players'),
      () => request(app.getHttpServer()).get('/players'),
      () => request(app.getHttpServer()).get('/players/1/profile'),
      () => request(app.getHttpServer()).get('/players/1'),
      () => request(app.getHttpServer()).patch('/players/1'),
      () => request(app.getHttpServer()).delete('/players/1'),
      () => request(app.getHttpServer()).post('/skills'),
      () => request(app.getHttpServer()).get('/skills'),
      () => request(app.getHttpServer()).get('/skills/1'),
      () => request(app.getHttpServer()).patch('/skills/1'),
      () => request(app.getHttpServer()).delete('/skills/1'),
      () => request(app.getHttpServer()).post('/players/1/skills'),
      () => request(app.getHttpServer()).get('/players/1/skills'),
      () => request(app.getHttpServer()).patch('/players/1/skills/1'),
      () => request(app.getHttpServer()).delete('/players/1/skills/1'),
      () => request(app.getHttpServer()).get('/skills/1/players'),
      () => request(app.getHttpServer()).post('/teams/1/players'),
      () => request(app.getHttpServer()).get('/teams/1/players'),
      () => request(app.getHttpServer()).patch('/teams/1/players/1/retirement'),
      () => request(app.getHttpServer()).get('/players/1/teams'),
      () => request(app.getHttpServer()).post('/matches/1/annotations'),
      () => request(app.getHttpServer()).get('/matches/1/annotations'),
      () => request(app.getHttpServer()).patch('/annotations/1'),
      () => request(app.getHttpServer()).delete('/annotations/1'),
    ];

    for (const probe of probes) {
      await probe().expect(401);
    }
  });

  afterEach(async () => {
    await app.close();
  });
});
