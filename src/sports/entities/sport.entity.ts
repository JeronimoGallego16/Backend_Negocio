import { Team } from '../../teams/entities/team.entity';
import { Tournament } from '../../tournaments/entities/tournament.entity';
import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

/**
 * Database entity representing a sport.
 */
@Entity('sports')
@Unique('uq_sports_name', ['name'])
export class Sport {
  @PrimaryGeneratedColumn({ name: 'sport_id', type: 'int' })
  sportId!: number;

  @Column({ name: 'name', type: 'varchar', length: 120 })
  name!: string;

  @Column({ name: 'description', type: 'text' })
  description!: string;

  @OneToMany(() => Tournament, (tournament) => tournament.sport, {
    cascade: false,
  })
  tournaments?: Tournament[];

  @OneToMany(() => Team, (team) => team.sport, { cascade: false })
  teams?: Team[];
}
