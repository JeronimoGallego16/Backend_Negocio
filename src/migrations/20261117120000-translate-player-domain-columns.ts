import { MigrationInterface, QueryRunner } from 'typeorm';

export class TranslatePlayerDomainColumns20261117120000 implements MigrationInterface {
  name = 'TranslatePlayerDomainColumns20261117120000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE player_skills DROP FOREIGN KEY fk_player_skills_jugador, DROP FOREIGN KEY fk_player_skills_habilidad, DROP CHECK chk_player_skills_nivel',
    );
    await queryRunner.query(
      'ALTER TABLE player_teams DROP FOREIGN KEY fk_player_teams_jugador, DROP FOREIGN KEY fk_player_teams_equipo, DROP INDEX uq_player_teams_one_active, DROP COLUMN jugador_vigente_id',
    );
    await queryRunner.query(
      'ALTER TABLE annotations DROP FOREIGN KEY fk_annotations_partido, DROP FOREIGN KEY fk_annotations_jugador, DROP INDEX idx_annotations_partido, DROP INDEX idx_annotations_jugador',
    );

    await queryRunner.query(`
      ALTER TABLE players
        CHANGE COLUMN id_jugador player_id INT NOT NULL AUTO_INCREMENT,
        CHANGE COLUMN nombre name VARCHAR(100) NOT NULL,
        CHANGE COLUMN apellido last_name VARCHAR(100) NOT NULL,
        CHANGE COLUMN fecha_nacimiento birth_date DATE NOT NULL,
        CHANGE COLUMN genero gender ENUM(
          'MASCULINO', 'FEMENINO', 'OTRO', 'PREFIERO_NO_DECIR',
          'MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'
        ) NOT NULL,
        CHANGE COLUMN correo email VARCHAR(150) NOT NULL,
        CHANGE COLUMN identificacion identification VARCHAR(30) NOT NULL,
        CHANGE COLUMN activo active TINYINT(1) NOT NULL DEFAULT 1,
        RENAME INDEX uq_players_correo TO uq_players_email,
        RENAME INDEX uq_players_identificacion TO uq_players_identification
    `);
    await queryRunner.query(`
      UPDATE players
      SET gender = CASE gender
        WHEN 'MASCULINO' THEN 'MALE'
        WHEN 'FEMENINO' THEN 'FEMALE'
        WHEN 'OTRO' THEN 'OTHER'
        WHEN 'PREFIERO_NO_DECIR' THEN 'PREFER_NOT_TO_SAY'
        ELSE gender
      END
    `);
    await queryRunner.query(`
      ALTER TABLE players
        MODIFY COLUMN gender ENUM(
          'MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'
        ) NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE skills
        CHANGE COLUMN id_habilidad skill_id INT NOT NULL AUTO_INCREMENT,
        CHANGE COLUMN nombre name VARCHAR(100) NOT NULL,
        RENAME INDEX uq_skills_nombre TO uq_skills_name
    `);
    await queryRunner.query(`
      ALTER TABLE player_skills
        CHANGE COLUMN id_habilidad_jugador player_skill_id INT NOT NULL AUTO_INCREMENT,
        CHANGE COLUMN nivel level TINYINT UNSIGNED NOT NULL,
        CHANGE COLUMN observaciones observations VARCHAR(500) NULL,
        CHANGE COLUMN id_jugador player_id INT NOT NULL,
        CHANGE COLUMN id_habilidad skill_id INT NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE player_teams
        CHANGE COLUMN id_historial player_team_id INT NOT NULL AUTO_INCREMENT,
        CHANGE COLUMN fecha_inicio start_date DATE NOT NULL,
        CHANGE COLUMN fecha_fin end_date DATE NULL,
        CHANGE COLUMN id_jugador player_id INT NOT NULL,
        CHANGE COLUMN id_equipo team_id INT NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE player_teams
        ADD COLUMN active_player_id INT
          GENERATED ALWAYS AS (
            CASE WHEN end_date IS NULL THEN player_id ELSE NULL END
          ) VIRTUAL,
        ADD UNIQUE INDEX uq_player_teams_one_active (active_player_id)
    `);
    await queryRunner.query(`
      ALTER TABLE annotations
        CHANGE COLUMN id_anotacion annotation_id INT NOT NULL AUTO_INCREMENT,
        CHANGE COLUMN id_partido match_id INT NOT NULL,
        CHANGE COLUMN minuto minute SMALLINT UNSIGNED NOT NULL,
        CHANGE COLUMN tipo type VARCHAR(30) NOT NULL,
        CHANGE COLUMN anulado voided TINYINT(1) NOT NULL DEFAULT 0,
        CHANGE COLUMN id_jugador player_id INT NOT NULL,
        ADD INDEX idx_annotations_match (match_id),
        ADD INDEX idx_annotations_player (player_id)
    `);

    await queryRunner.query(
      'ALTER TABLE player_skills ADD CONSTRAINT chk_player_skills_level CHECK (level BETWEEN 1 AND 5)',
    );
    await queryRunner.query(`
      ALTER TABLE player_skills
        ADD CONSTRAINT fk_player_skills_player FOREIGN KEY (player_id)
          REFERENCES players (player_id) ON DELETE RESTRICT,
        ADD CONSTRAINT fk_player_skills_skill FOREIGN KEY (skill_id)
          REFERENCES skills (skill_id) ON DELETE RESTRICT
    `);
    await queryRunner.query(`
      ALTER TABLE player_teams
        ADD CONSTRAINT fk_player_teams_player FOREIGN KEY (player_id)
          REFERENCES players (player_id) ON DELETE RESTRICT,
        ADD CONSTRAINT fk_player_teams_team FOREIGN KEY (team_id)
          REFERENCES teams (team_id) ON DELETE RESTRICT
    `);
    await queryRunner.query(`
      ALTER TABLE annotations
        ADD CONSTRAINT fk_annotations_match FOREIGN KEY (match_id)
          REFERENCES matches (match_id) ON DELETE RESTRICT,
        ADD CONSTRAINT fk_annotations_player FOREIGN KEY (player_id)
          REFERENCES players (player_id) ON DELETE RESTRICT
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE player_skills DROP FOREIGN KEY fk_player_skills_player, DROP FOREIGN KEY fk_player_skills_skill, DROP CHECK chk_player_skills_level',
    );
    await queryRunner.query(
      'ALTER TABLE player_teams DROP FOREIGN KEY fk_player_teams_player, DROP FOREIGN KEY fk_player_teams_team, DROP INDEX uq_player_teams_one_active, DROP COLUMN active_player_id',
    );
    await queryRunner.query(
      'ALTER TABLE annotations DROP FOREIGN KEY fk_annotations_match, DROP FOREIGN KEY fk_annotations_player, DROP INDEX idx_annotations_match, DROP INDEX idx_annotations_player',
    );

    await queryRunner.query(`
      ALTER TABLE players
        MODIFY COLUMN gender ENUM(
          'MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY',
          'MASCULINO', 'FEMENINO', 'OTRO', 'PREFIERO_NO_DECIR'
        ) NOT NULL
    `);
    await queryRunner.query(`
      UPDATE players
      SET gender = CASE gender
        WHEN 'MALE' THEN 'MASCULINO'
        WHEN 'FEMALE' THEN 'FEMENINO'
        WHEN 'OTHER' THEN 'OTRO'
        WHEN 'PREFER_NOT_TO_SAY' THEN 'PREFIERO_NO_DECIR'
        ELSE gender
      END
    `);
    await queryRunner.query(`
      ALTER TABLE players
        CHANGE COLUMN player_id id_jugador INT NOT NULL AUTO_INCREMENT,
        CHANGE COLUMN name nombre VARCHAR(100) NOT NULL,
        CHANGE COLUMN last_name apellido VARCHAR(100) NOT NULL,
        CHANGE COLUMN birth_date fecha_nacimiento DATE NOT NULL,
        CHANGE COLUMN gender genero ENUM(
          'MASCULINO', 'FEMENINO', 'OTRO', 'PREFIERO_NO_DECIR'
        ) NOT NULL,
        CHANGE COLUMN email correo VARCHAR(150) NOT NULL,
        CHANGE COLUMN identification identificacion VARCHAR(30) NOT NULL,
        CHANGE COLUMN active activo TINYINT(1) NOT NULL DEFAULT 1,
        RENAME INDEX uq_players_email TO uq_players_correo,
        RENAME INDEX uq_players_identification TO uq_players_identificacion
    `);
    await queryRunner.query(`
      ALTER TABLE skills
        CHANGE COLUMN skill_id id_habilidad INT NOT NULL AUTO_INCREMENT,
        CHANGE COLUMN name nombre VARCHAR(100) NOT NULL,
        RENAME INDEX uq_skills_name TO uq_skills_nombre
    `);
    await queryRunner.query(`
      ALTER TABLE player_skills
        CHANGE COLUMN player_skill_id id_habilidad_jugador INT NOT NULL AUTO_INCREMENT,
        CHANGE COLUMN level nivel TINYINT UNSIGNED NOT NULL,
        CHANGE COLUMN observations observaciones VARCHAR(500) NULL,
        CHANGE COLUMN player_id id_jugador INT NOT NULL,
        CHANGE COLUMN skill_id id_habilidad INT NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE player_teams
        CHANGE COLUMN player_team_id id_historial INT NOT NULL AUTO_INCREMENT,
        CHANGE COLUMN start_date fecha_inicio DATE NOT NULL,
        CHANGE COLUMN end_date fecha_fin DATE NULL,
        CHANGE COLUMN player_id id_jugador INT NOT NULL,
        CHANGE COLUMN team_id id_equipo INT NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE player_teams
        ADD COLUMN jugador_vigente_id INT
          GENERATED ALWAYS AS (
            CASE WHEN fecha_fin IS NULL THEN id_jugador ELSE NULL END
          ) VIRTUAL,
        ADD UNIQUE INDEX uq_player_teams_one_active (jugador_vigente_id)
    `);
    await queryRunner.query(`
      ALTER TABLE annotations
        CHANGE COLUMN annotation_id id_anotacion INT NOT NULL AUTO_INCREMENT,
        CHANGE COLUMN match_id id_partido INT NOT NULL,
        CHANGE COLUMN minute minuto SMALLINT UNSIGNED NOT NULL,
        CHANGE COLUMN type tipo VARCHAR(30) NOT NULL,
        CHANGE COLUMN voided anulado TINYINT(1) NOT NULL DEFAULT 0,
        CHANGE COLUMN player_id id_jugador INT NOT NULL,
        ADD INDEX idx_annotations_partido (id_partido),
        ADD INDEX idx_annotations_jugador (id_jugador)
    `);

    await queryRunner.query(
      'ALTER TABLE player_skills ADD CONSTRAINT chk_player_skills_nivel CHECK (nivel BETWEEN 1 AND 5)',
    );
    await queryRunner.query(`
      ALTER TABLE player_skills
        ADD CONSTRAINT fk_player_skills_jugador FOREIGN KEY (id_jugador)
          REFERENCES players (id_jugador) ON DELETE RESTRICT,
        ADD CONSTRAINT fk_player_skills_habilidad FOREIGN KEY (id_habilidad)
          REFERENCES skills (id_habilidad) ON DELETE RESTRICT
    `);
    await queryRunner.query(`
      ALTER TABLE player_teams
        ADD CONSTRAINT fk_player_teams_jugador FOREIGN KEY (id_jugador)
          REFERENCES players (id_jugador) ON DELETE RESTRICT,
        ADD CONSTRAINT fk_player_teams_equipo FOREIGN KEY (id_equipo)
          REFERENCES teams (team_id) ON DELETE RESTRICT
    `);
    await queryRunner.query(`
      ALTER TABLE annotations
        ADD CONSTRAINT fk_annotations_partido FOREIGN KEY (id_partido)
          REFERENCES matches (match_id) ON DELETE RESTRICT,
        ADD CONSTRAINT fk_annotations_jugador FOREIGN KEY (id_jugador)
          REFERENCES players (id_jugador) ON DELETE RESTRICT
    `);
  }
}
