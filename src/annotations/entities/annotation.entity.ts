import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Player } from '../../players/entities/player.entity';
import { Match } from '../../matches/entities/match.entity';

@Entity('annotations')
export class Annotation {
  @PrimaryGeneratedColumn({ name: 'annotation_id', type: 'int' })
  annotationId!: number;

  @Index('idx_annotations_match')
  @Column({ name: 'match_id', type: 'int' })
  matchId!: number;

  @Column({ type: 'smallint', unsigned: true })
  minute!: number;

  @Column({ type: 'varchar', length: 30 })
  type!: string;

  @Column({ type: 'boolean', default: false })
  voided!: boolean;

  @Index('idx_annotations_player')
  @Column({ name: 'player_id', type: 'int' })
  playerId!: number;

  @ManyToOne(() => Match, (match) => match.annotations, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'match_id' })
  match!: Relation<Match>;

  @ManyToOne(() => Player, (player) => player.annotations, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'player_id' })
  player!: Relation<Player>;
}
