import { Team } from '../../teams/entities/team.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { GroupPhase } from '../../phases/entities/group-phase.entity';

/**
 * Database entity representing a group inside a group phase.
 */
@Entity('competition_groups')
@Unique('uq_competition_groups_phase_letter', ['phaseId', 'letterOrNumber'])
export class CompetitionGroup {
  @PrimaryGeneratedColumn({ name: 'group_id', type: 'int' })
  groupId!: number;

  @Column({ name: 'phase_id', type: 'int' })
  phaseId!: number;

  @ManyToOne(() => GroupPhase, (phase) => phase.groups, {
    cascade: false,
    nullable: false,
    onDelete: 'NO ACTION',
  })
  @JoinColumn({ name: 'phase_id' })
  phase!: GroupPhase;

  @Column({ name: 'letter_or_number', type: 'varchar', length: 20 })
  letterOrNumber!: string;

  @Column({ name: 'max_teams', type: 'int' })
  maxTeams!: number;

  @OneToMany(() => Team, (team) => team.group, {
    cascade: false,
  })
  teams?: Team[];
}
