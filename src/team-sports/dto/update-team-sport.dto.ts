import { PartialType } from '@nestjs/mapped-types';
import { CreateTeamSportDto } from './create-team-sport.dto';

/**
 * Optional identifiers used to change an existing team-sport assignment.
 */
export class UpdateTeamSportDto extends PartialType(CreateTeamSportDto) {}
