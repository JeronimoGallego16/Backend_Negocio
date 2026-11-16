import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Jugador } from '../../players/entities/jugador.entity';
import { Match } from './match.entity';

@Entity('annotations')
export class Anotacion {
  @PrimaryGeneratedColumn({ name: 'id_anotacion', type: 'int' })
  idAnotacion!: number;

  @Index('idx_annotations_partido')
  @Column({ name: 'id_partido', type: 'int' })
  idPartido!: number;

  @Column({ type: 'smallint', unsigned: true })
  minuto!: number;

  @Column({ type: 'varchar', length: 30 })
  tipo!: string;

  @Column({ type: 'boolean', default: false })
  anulado!: boolean;

  @Index('idx_annotations_jugador')
  @Column({ name: 'id_jugador', type: 'int' })
  idJugador!: number;

  @ManyToOne(() => Match, (partido) => partido.anotaciones, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'id_partido' })
  partido!: Relation<Match>;

  @ManyToOne(() => Jugador, (jugador) => jugador.anotaciones, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'id_jugador' })
  jugador!: Relation<Jugador>;
}
