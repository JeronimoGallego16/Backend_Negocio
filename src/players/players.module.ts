import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EquipoJugador } from './entities/equipo-jugador.entity';
import { HabilidadJugador } from './entities/habilidad-jugador.entity';
import { Habilidad } from './entities/habilidad.entity';
import { Jugador } from './entities/jugador.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Jugador,
      Habilidad,
      HabilidadJugador,
      EquipoJugador,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class PlayersModule {}
