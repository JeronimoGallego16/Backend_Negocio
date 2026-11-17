import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlayerDomain20261116120000 implements MigrationInterface {
  name = 'CreatePlayerDomain20261116120000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE players (
        player_id INT NOT NULL AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        birth_date DATE NOT NULL,
        gender ENUM(
          'MALE',
          'FEMALE',
          'OTHER',
          'PREFER_NOT_TO_SAY'
        ) NOT NULL,
        email VARCHAR(150) NOT NULL,
        identification VARCHAR(30) NOT NULL,
        active TINYINT(1) NOT NULL DEFAULT 1,
        PRIMARY KEY (player_id),
        UNIQUE KEY uq_players_email (email),
        UNIQUE KEY uq_players_identification (identification)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE skills (
        skill_id INT NOT NULL AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        description VARCHAR(255) NULL,
        PRIMARY KEY (skill_id),
        UNIQUE KEY uq_skills_name (name)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE player_skills (
        player_skill_id INT NOT NULL AUTO_INCREMENT,
        level TINYINT UNSIGNED NOT NULL,
        observations VARCHAR(500) NULL,
        player_id INT NOT NULL,
        skill_id INT NOT NULL,
        PRIMARY KEY (player_skill_id),
        UNIQUE KEY uq_player_skills_player_skill (player_id, skill_id),
        CONSTRAINT chk_player_skills_level CHECK (level BETWEEN 1 AND 5),
        CONSTRAINT fk_player_skills_player FOREIGN KEY (player_id)
          REFERENCES players (player_id) ON DELETE RESTRICT,
        CONSTRAINT fk_player_skills_skill FOREIGN KEY (skill_id)
          REFERENCES skills (skill_id) ON DELETE RESTRICT
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE player_teams (
        player_team_id INT NOT NULL AUTO_INCREMENT,
        start_date DATE NOT NULL,
        end_date DATE NULL,
        player_id INT NOT NULL,
        team_id INT NOT NULL,
        active_player_id INT
          GENERATED ALWAYS AS (
            CASE WHEN end_date IS NULL THEN player_id ELSE NULL END
          ) VIRTUAL,
        PRIMARY KEY (player_team_id),
        UNIQUE KEY uq_player_teams_period (player_id, team_id, start_date),
        UNIQUE KEY uq_player_teams_one_active (active_player_id),
        CONSTRAINT fk_player_teams_player FOREIGN KEY (player_id)
          REFERENCES players (player_id) ON DELETE RESTRICT,
        CONSTRAINT fk_player_teams_team FOREIGN KEY (team_id)
          REFERENCES teams (team_id) ON DELETE RESTRICT
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE annotations (
        annotation_id INT NOT NULL AUTO_INCREMENT,
        match_id INT NOT NULL,
        minute SMALLINT UNSIGNED NOT NULL,
        type VARCHAR(30) NOT NULL,
        voided TINYINT(1) NOT NULL DEFAULT 0,
        player_id INT NOT NULL,
        PRIMARY KEY (annotation_id),
        KEY idx_annotations_match (match_id),
        KEY idx_annotations_player (player_id),
        CONSTRAINT fk_annotations_match FOREIGN KEY (match_id)
          REFERENCES matches (match_id) ON DELETE RESTRICT,
        CONSTRAINT fk_annotations_player FOREIGN KEY (player_id)
          REFERENCES players (player_id) ON DELETE RESTRICT
      ) ENGINE=InnoDB
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE annotations');
    await queryRunner.query('DROP TABLE player_teams');
    await queryRunner.query('DROP TABLE player_skills');
    await queryRunner.query('DROP TABLE skills');
    await queryRunner.query('DROP TABLE players');
  }
}
