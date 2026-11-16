import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Habilidad } from './habilidad.entity';
import { Jugador } from './jugador.entity';

@Entity('player_skills')
@Unique('uq_player_skills_player_skill', ['idJugador', 'idHabilidad'])
@Check('chk_player_skills_nivel', '`nivel` BETWEEN 1 AND 5')
export class HabilidadJugador {
  @PrimaryGeneratedColumn({ name: 'id_habilidad_jugador', type: 'int' })
  idHabilidadJugador!: number;

  @Column({ type: 'tinyint', unsigned: true })
  nivel!: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  observaciones!: string | null;

  @Column({ name: 'id_jugador', type: 'int' })
  idJugador!: number;

  @Column({ name: 'id_habilidad', type: 'int' })
  idHabilidad!: number;

  @ManyToOne(() => Jugador, (jugador) => jugador.habilidades, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'id_jugador' })
  jugador!: Relation<Jugador>;

  @ManyToOne(() => Habilidad, (habilidad) => habilidad.jugadores, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'id_habilidad' })
  habilidad!: Relation<Habilidad>;
}
