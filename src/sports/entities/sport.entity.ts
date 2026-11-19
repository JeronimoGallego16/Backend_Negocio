import { Team } from '../../teams/entities/team.entity';
import { Tournament } from '../../tournaments/entities/tournament.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { TeamSport } from '../../team-sports/entities/team-sport.entity';

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

  @ManyToOne(() => Sport, (sport) => sport.subcategories, {
    cascade: false,
    nullable: true,
    onDelete: 'NO ACTION',
  })
  @JoinColumn({ name: 'parent_id', referencedColumnName: 'sportId' })
  parentSport?: Sport | null;

  @OneToMany(() => Sport, (sport) => sport.parentSport, { cascade: false })
  subcategories?: Sport[];

  @OneToMany(() => TeamSport, (teamSport) => teamSport.sport, {
    cascade: false,
  })
  teamSports?: TeamSport[];
}
