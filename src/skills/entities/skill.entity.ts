import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { PlayerSkill } from '../../player-skills/entities/player-skill.entity';

@Entity('skills')
export class Skill {
  @PrimaryGeneratedColumn({ name: 'skill_id', type: 'int' })
  skillId!: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string | null;

  @OneToMany(() => PlayerSkill, (playerSkill) => playerSkill.skill)
  playerSkills!: Relation<PlayerSkill[]>;
}
