import {
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Sport } from '../../sports/entities/sport.entity';
import { Team } from '../../teams/entities/team.entity';

/**
 * Database entity representing a sport assigned to a team.
 */
@Entity('team_sports')
@Unique('uq_team_sports_team_sport', ['team', 'sport'])
export class TeamSport {
  @PrimaryGeneratedColumn({ name: 'team_sport_id', type: 'int' })
  teamSportId!: number;

  @ManyToOne(() => Team, (team) => team.teamSports, {
    cascade: false,
    nullable: false,
    onDelete: 'NO ACTION',
  })
  @JoinColumn({ name: 'team_id', referencedColumnName: 'teamId' })
  team!: Relation<Team>;

  @ManyToOne(() => Sport, (sport) => sport.teamSports, {
    cascade: false,
    nullable: false,
    onDelete: 'NO ACTION',
  })
  @JoinColumn({ name: 'sport_id', referencedColumnName: 'sportId' })
  sport!: Relation<Sport>;
}
