import { Phase } from '../../phases/entities/phase.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Team } from '../../teams/entities/team.entity';

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

  @Column({ name: 'phase_id', type: 'int', nullable: true })
  phaseId?: number;

  @ManyToOne(() => Phase, {
    cascade: false,
    nullable: true,
    onDelete: 'NO ACTION',
  })
  @JoinColumn({ name: 'phase_id' })
  phase?: Phase;

  @ManyToOne(() => Team, (team) => team.homeMatches, {
    cascade: false,
    nullable: false,
    onDelete: 'NO ACTION',
  })
  @JoinColumn({ name: 'home_team_id', referencedColumnName: 'teamId' })
  homeTeam!: Team;

  @ManyToOne(() => Team, (team) => team.awayMatches, {
    cascade: false,
    nullable: false,
    onDelete: 'NO ACTION',
  })
  @JoinColumn({ name: 'away_team_id', referencedColumnName: 'teamId' })
  awayTeam!: Team;
}
