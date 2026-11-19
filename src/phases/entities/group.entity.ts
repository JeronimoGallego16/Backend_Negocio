import { Team } from '../../teams/entities/team.entity';
import { ChildEntity, Column, OneToMany } from 'typeorm';
import { Phase } from './phase.entity';

/**
 * Phase subtype representing a competition group.
 */
@ChildEntity('GROUP')
export class Group extends Phase {
  @Column({ name: 'letter_or_number', type: 'varchar', length: 20 })
  letterOrNumber!: string;

  @Column({ name: 'max_teams', type: 'int' })
  maxTeams!: number;

  @OneToMany(() => Team, (team) => team.group, {
    cascade: false,
  })
  teams?: Team[];
}
