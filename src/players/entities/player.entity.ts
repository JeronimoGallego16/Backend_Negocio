import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { Annotation } from '../../annotations/entities/annotation.entity';
import { PlayerTeam } from '../../player-teams/entities/player-team.entity';
import { PlayerSkill } from '../../player-skills/entities/player-skill.entity';

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY',
}

@Entity('players')
export class Player {
  @PrimaryGeneratedColumn({ name: 'player_id', type: 'int' })
  playerId!: number;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  lastName!: string;

  @Column({ name: 'birth_date', type: 'date' })
  birthDate!: string;

  @Column({ type: 'enum', enum: Gender })
  gender!: Gender;

  @Column({ type: 'varchar', length: 150, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 30, unique: true })
  identification!: string;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @OneToMany(() => PlayerSkill, (playerSkill) => playerSkill.player)
  skills!: Relation<PlayerSkill[]>;

  @OneToMany(() => PlayerTeam, (playerTeam) => playerTeam.player)
  teams!: Relation<PlayerTeam[]>;

  @OneToMany(() => Annotation, (annotation) => annotation.player)
  annotations!: Relation<Annotation[]>;
}
