import { Registration } from '../../registrations/entities/registration.entity';
import { Sport } from '../../sports/entities/sport.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

/**
 * Database entity representing a tournament team.
 */
@Entity('teams')
@Unique('uq_teams_name_category', ['name', 'category'])
export class Team {
  @PrimaryGeneratedColumn({ name: 'team_id', type: 'int' })
  teamId!: number;

  @Column({ name: 'name', type: 'varchar', length: 120 })
  name!: string;

  @Column({ name: 'category', type: 'varchar', length: 80 })
  category!: string;

  @Column({ name: 'sport_id', type: 'int', nullable: true })
  sportId?: number;

  @ManyToOne(() => Sport, { cascade: false, nullable: true, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'sport_id' })
  sport?: Sport;

  @OneToMany(() => Registration, (registration) => registration.team, {
    cascade: false,
  })
  registrations?: Registration[];
}
