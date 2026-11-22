import { Team } from '../../teams/entities/team.entity';
import { Tournament } from '../../tournaments/entities/tournament.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import type { Relation } from 'typeorm';

/**
 * Database entity representing a team's registration in a tournament.
 */
@Entity('registrations')
@Unique('uq_registrations_tournament_team', ['tournament', 'team'])
export class Registration {
  @PrimaryGeneratedColumn({ name: 'registration_id', type: 'int' })
  registrationId!: number;

  @Column({ name: 'registration_date', type: 'date' })
  registrationDate!: string;

  @ManyToOne(() => Tournament, (tournament) => tournament.registrations, {
    cascade: false,
    nullable: false,
    onDelete: 'NO ACTION',
  })
  @JoinColumn({ name: 'tournament_id' })
  tournament!: Relation<Tournament>;

  @ManyToOne(() => Team, (team) => team.registrations, {
    cascade: false,
    nullable: false,
    onDelete: 'NO ACTION',
  })
  @JoinColumn({ name: 'team_id' })
  team!: Relation<Team>;
}
