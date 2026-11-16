import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { Anotacion } from '../../matches/entities/anotacion.entity';
import { EquipoJugador } from './equipo-jugador.entity';
import { HabilidadJugador } from './habilidad-jugador.entity';

export enum Genero {
  MASCULINO = 'MASCULINO',
  FEMENINO = 'FEMENINO',
  OTRO = 'OTRO',
  PREFIERO_NO_DECIR = 'PREFIERO_NO_DECIR',
}

@Entity('players')
export class Jugador {
  @PrimaryGeneratedColumn({ name: 'id_jugador', type: 'int' })
  idJugador!: number;

  @Column({ type: 'varchar', length: 100 })
  nombre!: string;

  @Column({ type: 'varchar', length: 100 })
  apellido!: string;

  @Column({ name: 'fecha_nacimiento', type: 'date' })
  fechaNacimiento!: string;

  @Column({ type: 'enum', enum: Genero })
  genero!: Genero;

  @Column({ type: 'varchar', length: 150, unique: true })
  correo!: string;

  @Column({ type: 'varchar', length: 30, unique: true })
  identificacion!: string;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  @OneToMany(
    () => HabilidadJugador,
    (habilidadJugador) => habilidadJugador.jugador,
  )
  habilidades!: Relation<HabilidadJugador[]>;

  @OneToMany(() => EquipoJugador, (equipoJugador) => equipoJugador.jugador)
  equipos!: Relation<EquipoJugador[]>;

  @OneToMany(() => Anotacion, (anotacion) => anotacion.jugador)
  anotaciones!: Relation<Anotacion[]>;
}
