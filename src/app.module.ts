import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SecurityGuard } from './common/guards/security.guard';
import { Anotacion } from './matches/entities/anotacion.entity';
import { Match } from './matches/entities/match.entity';
import { MatchesModule } from './matches/matches.module';
import { PlayersModule } from './players/players.module';
import { EquipoJugador } from './players/entities/equipo-jugador.entity';
import { HabilidadJugador } from './players/entities/habilidad-jugador.entity';
import { Habilidad } from './players/entities/habilidad.entity';
import { Jugador } from './players/entities/jugador.entity';
import { SportsModule } from './sports/sports.module';
import { Sport } from './sports/entities/sport.entity';
import { TeamsModule } from './teams/teams.module';
import { Team } from './teams/entities/team.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASS'),
        database: configService.get<string>('DB_NAME'),
        entities: [
          Team,
          Sport,
          Match,
          Anotacion,
          Jugador,
          Habilidad,
          HabilidadJugador,
          EquipoJugador,
        ],
        synchronize: false,
      }),
    }),
    TeamsModule,
    SportsModule,
    MatchesModule,
    PlayersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: SecurityGuard,
    },
  ],
})
export class AppModule {}
