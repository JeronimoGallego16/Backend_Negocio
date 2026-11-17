import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Skill } from '../../skills/entities/skill.entity';
import { Player } from '../../players/entities/player.entity';

@Entity('player_skills')
@Unique('uq_player_skills_player_skill', ['playerId', 'skillId'])
@Check('chk_player_skills_level', '`level` BETWEEN 1 AND 5')
export class PlayerSkill {
  @PrimaryGeneratedColumn({ name: 'player_skill_id', type: 'int' })
  playerSkillId!: number;

  @Column({ type: 'tinyint', unsigned: true })
  level!: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  observations!: string | null;

  @Column({ name: 'player_id', type: 'int' })
  playerId!: number;

  @Column({ name: 'skill_id', type: 'int' })
  skillId!: number;

  @ManyToOne(() => Player, (player) => player.skills, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'player_id' })
  player!: Relation<Player>;

  @ManyToOne(() => Skill, (skill) => skill.playerSkills, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'skill_id' })
  skill!: Relation<Skill>;
}
