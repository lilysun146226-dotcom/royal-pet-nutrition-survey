export const createResponsesSql=`CREATE TABLE IF NOT EXISTS survey_responses (
id INTEGER PRIMARY KEY AUTOINCREMENT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
pet_type TEXT NOT NULL, age_stage TEXT NOT NULL, health_status TEXT NOT NULL,
concerns TEXT NOT NULL, feeding_issue TEXT NOT NULL, royal_usage TEXT NOT NULL,
trust_source TEXT NOT NULL, price_attitude TEXT NOT NULL)`;
export const createCreatedIndexSql=`CREATE INDEX IF NOT EXISTS idx_survey_responses_created_at ON survey_responses(created_at)`;
