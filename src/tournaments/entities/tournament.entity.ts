import { Registration } from '../../registrations/entities/registration.entity';
import { Sport } from '../../sports/entities/sport.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Database entity representing a sports tournament.
 */
@Entity('tournaments')
export class Tournament {
  @PrimaryGeneratedColumn({ name: 'tournament_id', type: 'int' })
  tournamentId!: number;

  @Column({ name: 'name', type: 'varchar', length: 150 })
  name!: string;

  @Column({ name: 'modality', type: 'varchar', length: 50 })
  modality!: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate!: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate!: string;

  @Column({ name: 'registration_end_date', type: 'date', nullable: true })
  registrationEndDate?: string | null;

  @Column({ name: 'status', type: 'varchar', length: 30 })
  status!: string;

  @Column({ name: 'capacity', type: 'int' })
  capacity!: number;

  @ManyToOne(() => Sport, {
    cascade: false,
    nullable: false,
    onDelete: 'NO ACTION',
  })
  @JoinColumn({ name: 'sport_id' })
  sport!: Sport;

  @OneToMany(() => Registration, (registration) => registration.tournament, {
    cascade: false,
  })
  registrations?: Registration[];

}
