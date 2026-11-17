import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

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

  it('registers the player, team-history, skill and annotation routes', async () => {
    const probes = [
      () => request(app.getHttpServer()).post('/jugadores'),
      () => request(app.getHttpServer()).get('/jugadores/1/perfil'),
      () => request(app.getHttpServer()).post('/habilidades'),
      () => request(app.getHttpServer()).post('/jugadores/1/habilidades'),
      () => request(app.getHttpServer()).post('/teams/1/jugadores'),
      () => request(app.getHttpServer()).post('/matches/1/anotaciones'),
      () => request(app.getHttpServer()).patch('/anotaciones/1'),
    ];

    for (const probe of probes) {
      await probe().expect(401);
    }
  });

  afterEach(async () => {
    await app.close();
  });
});
