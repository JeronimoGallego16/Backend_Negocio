import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamsModule } from '../teams/teams.module';
import { EquipoJugador } from './entities/equipo-jugador.entity';
import { HabilidadJugador } from './entities/habilidad-jugador.entity';
import { Habilidad } from './entities/habilidad.entity';
import { Jugador } from './entities/jugador.entity';
import { EquiposJugadorController } from './equipos-jugador.controller';
import { HabilidadesController } from './habilidades.controller';
import { HabilidadesJugadorController } from './habilidades-jugador.controller';
import { JugadoresController } from './jugadores.controller';
import { EquiposJugadorService } from './equipos-jugador.service';
import { HabilidadesService } from './habilidades.service';
import { HabilidadesJugadorService } from './habilidades-jugador.service';
import { JugadoresService } from './jugadores.service';
import { PerfilJugadorService } from './perfil-jugador.service';
import { EquipoJugadorMapper } from './mappers/equipo-jugador.mapper';
import { HabilidadMapper } from './mappers/habilidad.mapper';
import { HabilidadJugadorMapper } from './mappers/habilidad-jugador.mapper';
import { JugadorMapper } from './mappers/jugador.mapper';
import { EquiposJugadorRepository } from './repositories/equipos-jugador.repository';
import { HabilidadesRepository } from './repositories/habilidades.repository';
import { HabilidadesJugadorRepository } from './repositories/habilidades-jugador.repository';
import { JugadoresRepository } from './repositories/jugadores.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Jugador,
      Habilidad,
      HabilidadJugador,
      EquipoJugador,
    ]),
    TeamsModule,
  ],
  controllers: [
    JugadoresController,
    HabilidadesController,
    HabilidadesJugadorController,
    EquiposJugadorController,
  ],
  providers: [
    JugadoresService,
    HabilidadesService,
    HabilidadesJugadorService,
    EquiposJugadorService,
    PerfilJugadorService,
    JugadoresRepository,
    HabilidadesRepository,
    HabilidadesJugadorRepository,
    EquiposJugadorRepository,
    JugadorMapper,
    HabilidadMapper,
    HabilidadJugadorMapper,
    EquipoJugadorMapper,
  ],
  exports: [JugadoresService, EquiposJugadorService],
})
export class PlayersModule {}
