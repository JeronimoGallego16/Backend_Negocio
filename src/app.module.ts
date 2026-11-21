import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SecurityGuard } from './common/guards/security.guard';
import { AnnotationsModule } from './annotations/annotations.module';
import { Annotation } from './annotations/entities/annotation.entity';
import { Match } from './matches/entities/match.entity';
import { MatchesModule } from './matches/matches.module';
import { PlayersModule } from './players/players.module';
import { PlayerProfileModule } from './players/player-profile.module';
import { PlayerTeam } from './player-teams/entities/player-team.entity';
import { PlayerSkill } from './player-skills/entities/player-skill.entity';
import { Skill } from './skills/entities/skill.entity';
import { Player } from './players/entities/player.entity';
import { PlayerSkillsModule } from './player-skills/player-skills.module';
import { PlayerTeamsModule } from './player-teams/player-teams.module';
import { SkillsModule } from './skills/skills.module';
import { SportsModule } from './sports/sports.module';
import { Sport } from './sports/entities/sport.entity';
import { TeamsModule } from './teams/teams.module';
<<<<<<< HEAD
import { Team } from './teams/entities/team.entity';
=======
import { TournamentsModule } from './tournaments/tournaments.module';
import { RegistrationsModule } from './registrations/registrations.module';
import { PhasesModule } from './phases/phases.module';
import { TeamSportsModule } from './team-sports/team-sports.module';
import { GroupsModule } from './groups/groups.module';
>>>>>>> origin/develop

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
          Annotation,
          Player,
          Skill,
          PlayerSkill,
          PlayerTeam,
        ],
        synchronize: false,
      }),
    }),
    TeamsModule,
    SportsModule,
    MatchesModule,
<<<<<<< HEAD
    PlayersModule,
    SkillsModule,
    PlayerSkillsModule,
    PlayerTeamsModule,
    PlayerProfileModule,
    AnnotationsModule,
=======
    TournamentsModule,
    RegistrationsModule,
    PhasesModule,
    TeamSportsModule,
    GroupsModule,
>>>>>>> origin/develop
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
