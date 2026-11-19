import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Request data for creating or updating a competition group.
 */
export class CompetitionGroupDto {
  @IsOptional()
  @IsString()
  @Matches(/\S/)
  @MaxLength(20)
  letterOrNumber?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxTeams?: number;
}
