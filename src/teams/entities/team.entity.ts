import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Match } from '../../matches/entities/match.entity';
import { TeamSport } from '../../team-sports/entities/team-sport.entity';

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

  @OneToMany(() => Match, (match) => match.homeTeam, { cascade: false })
  homeMatches?: Match[];

  @OneToMany(() => Match, (match) => match.awayTeam, { cascade: false })
  awayMatches?: Match[];

  @OneToMany(() => TeamSport, (teamSport) => teamSport.team, {
    cascade: false,
  })
  teamSports?: TeamSport[];
}
