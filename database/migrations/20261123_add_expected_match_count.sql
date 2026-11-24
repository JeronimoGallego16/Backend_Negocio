ALTER TABLE phases
  ADD COLUMN expected_match_count INT NULL;

UPDATE phases AS phase
LEFT JOIN (
  SELECT phase_id, SUM(CASE WHEN is_third_place = 0 THEN 1 ELSE 0 END) AS main_match_count
  FROM matches
  GROUP BY phase_id
) AS match_counts ON match_counts.phase_id = phase.phase_id
SET phase.expected_match_count = NULLIF(match_counts.main_match_count, 0)
WHERE phase.phase_type = 'FINAL';
