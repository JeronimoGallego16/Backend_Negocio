import { Registration } from '../../registrations/entities/registration.entity';
import { CompetitionGroup } from '../../groups/entities/competition-group.entity';
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

  @Column({ name: 'sport_id', type: 'int', nullable: true })
  sportId?: number;

  @ManyToOne(() => Sport, { cascade: false, nullable: true, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'sport_id' })
  sport?: Sport;

  @OneToMany(() => Registration, (registration) => registration.team, {
    cascade: false,
  })
  registrations?: Registration[];

  @Column({ name: 'group_id', type: 'int', nullable: true })
  groupId?: number | null;

  @ManyToOne(() => CompetitionGroup, (group) => group.teams, {
    cascade: false,
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'group_id' })
  group?: CompetitionGroup | null;
  
  @OneToMany(() => Match, (match) => match.homeTeam, { cascade: false })
  homeMatches?: Match[];

  @OneToMany(() => Match, (match) => match.awayTeam, { cascade: false })
  awayMatches?: Match[];

  @OneToMany(() => TeamSport, (teamSport) => teamSport.team, {
    cascade: false,
  })
  teamSports?: TeamSport[];
}
