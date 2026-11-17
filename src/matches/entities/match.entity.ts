import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { Annotation } from '../../annotations/entities/annotation.entity';

/**
 * Database entity representing a match.
 */
@Entity('matches')
export class Match {
  @PrimaryGeneratedColumn({ name: 'match_id', type: 'int' })
  matchId!: number;

  @Column({ name: 'duration', type: 'varchar', length: 50 })
  duration!: string;

  @Column({ name: 'state', type: 'varchar', length: 50 })
  state!: string;

  @OneToMany(() => Annotation, (annotation) => annotation.match)
  annotations!: Relation<Annotation[]>;
}
