import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
}
