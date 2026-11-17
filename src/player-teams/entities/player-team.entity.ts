import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Team } from '../../teams/entities/team.entity';
import { Player } from '../../players/entities/player.entity';

@Entity('player_teams')
@Unique('uq_player_teams_period', ['playerId', 'teamId', 'startDate'])
@Index('uq_player_teams_one_active', ['activePlayerId'], { unique: true })
export class PlayerTeam {
  @PrimaryGeneratedColumn({ name: 'player_team_id', type: 'int' })
  playerTeamId!: number;

  @Column({ name: 'start_date', type: 'date' })
  startDate!: string;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate!: string | null;

  @Column({ name: 'player_id', type: 'int' })
  playerId!: number;

  @Column({ name: 'team_id', type: 'int' })
  teamId!: number;

  @Column({
    name: 'active_player_id',
    type: 'int',
    nullable: true,
    asExpression: 'CASE WHEN `end_date` IS NULL THEN `player_id` ELSE NULL END',
    generatedType: 'VIRTUAL',
    insert: false,
    update: false,
  })
  activePlayerId!: number | null;

  @ManyToOne(() => Player, (player) => player.teams, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'player_id' })
  player!: Relation<Player>;

  @ManyToOne(() => Team, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'team_id' })
  team!: Relation<Team>;
}
