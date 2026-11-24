import { IsInt, Min } from 'class-validator';

/**
 * Request data required to finish a match with its final score.
 */
export class MatchResultDto {
  @IsInt()
  @Min(0)
  homeScore!: number;

  @IsInt()
  @Min(0)
  awayScore!: number;
}
