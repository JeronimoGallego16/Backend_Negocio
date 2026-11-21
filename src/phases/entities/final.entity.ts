import { ChildEntity, Column } from 'typeorm';
import { Phase } from './phase.entity';

/**
 * Phase subtype representing a final or knockout phase.
 */
@ChildEntity('FINAL')
export class FinalPhase extends Phase {
  @Column({ name: 'is_third_place', type: 'boolean', default: false })
  isThirdPlace!: boolean;
}
