import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  TableInheritance,
  Unique,
} from 'typeorm';

/**
 * Abstract base entity for tournament phases.
 */
@Entity('phases')
@TableInheritance({
  column: { name: 'phase_type', type: 'varchar', length: 20 },
})
@Unique('uq_phases_tournament_order', ['tournamentId', 'order'])
export abstract class Phase {
  @PrimaryGeneratedColumn({ name: 'phase_id', type: 'int' })
  phaseId!: number;

  @Column({ name: 'name', type: 'varchar', length: 150 })
  name!: string;

  @Column({ name: 'phase_order', type: 'int' })
  order!: number;

  @Column({ name: 'tournament_id', type: 'int' })
  tournamentId!: number;
}
