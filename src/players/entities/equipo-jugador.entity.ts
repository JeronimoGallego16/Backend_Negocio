import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Team } from '../../teams/entities/team.entity';
import { Jugador } from './jugador.entity';

@Entity('player_teams')
@Unique('uq_player_teams_period', ['idJugador', 'idEquipo', 'fechaInicio'])
@Index('uq_player_teams_one_active', ['jugadorVigenteId'], { unique: true })
export class EquipoJugador {
  @PrimaryGeneratedColumn({ name: 'id_historial', type: 'int' })
  idHistorial!: number;

  @Column({ name: 'fecha_inicio', type: 'date' })
  fechaInicio!: string;

  @Column({ name: 'fecha_fin', type: 'date', nullable: true })
  fechaFin!: string | null;

  @Column({ name: 'id_jugador', type: 'int' })
  idJugador!: number;

  @Column({ name: 'id_equipo', type: 'int' })
  idEquipo!: number;

  @Column({
    name: 'jugador_vigente_id',
    type: 'int',
    nullable: true,
    asExpression:
      'CASE WHEN `fecha_fin` IS NULL THEN `id_jugador` ELSE NULL END',
    generatedType: 'VIRTUAL',
    insert: false,
    update: false,
  })
  jugadorVigenteId!: number | null;

  @ManyToOne(() => Jugador, (jugador) => jugador.equipos, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'id_jugador' })
  jugador!: Relation<Jugador>;

  @ManyToOne(() => Team, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_equipo' })
  equipo!: Relation<Team>;
}
