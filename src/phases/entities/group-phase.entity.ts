import { ChildEntity, OneToMany } from 'typeorm';
import type { Relation } from 'typeorm';
import { CompetitionGroup } from '../../groups/entities/competition-group.entity';
import { Phase } from './phase.entity';

/**
 * Phase subtype that contains the competition groups for a tournament stage.
 */
@ChildEntity('GROUP')
export class GroupPhase extends Phase {
  @OneToMany(() => CompetitionGroup, (group) => group.phase, {
    cascade: false,
  })
  groups?: Relation<CompetitionGroup[]>;
}
