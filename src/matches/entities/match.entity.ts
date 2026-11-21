<<<<<<< HEAD
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { Annotation } from '../../annotations/entities/annotation.entity';
=======
import { Phase } from '../../phases/entities/phase.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Team } from '../../teams/entities/team.entity';
>>>>>>> origin/develop

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

<<<<<<< HEAD
  @OneToMany(() => Annotation, (annotation) => annotation.match)
  annotations!: Relation<Annotation[]>;
=======
  @Column({ name: 'home_score', type: 'int', nullable: true })
  homeScore?: number;

  @Column({ name: 'away_score', type: 'int', nullable: true })
  awayScore?: number;

  @Column({ name: 'round_name', type: 'varchar', length: 50, nullable: true })
  roundName?: string;

  @Column({ name: 'bracket_position', type: 'int', nullable: true })
  bracketPosition?: number;

  @Column({ name: 'next_match_id', type: 'int', nullable: true })
  nextMatchId?: number;

  @Column({
    name: 'is_third_place',
    type: 'boolean',
    default: false,
  })
  isThirdPlace!: boolean;

  @Column({
    name: 'result_registered',
    type: 'boolean',
    default: false,
  })
  resultRegistered!: boolean;

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
>>>>>>> origin/develop
}
