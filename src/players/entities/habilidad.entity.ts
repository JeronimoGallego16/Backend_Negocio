import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { HabilidadJugador } from './habilidad-jugador.entity';

@Entity('skills')
export class Habilidad {
  @PrimaryGeneratedColumn({ name: 'id_habilidad', type: 'int' })
  idHabilidad!: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  nombre!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  descripcion!: string | null;

  @OneToMany(
    () => HabilidadJugador,
    (habilidadJugador) => habilidadJugador.habilidad,
  )
  jugadores!: Relation<HabilidadJugador[]>;
}
