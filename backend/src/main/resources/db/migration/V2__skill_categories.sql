-- Skill groups now match the portfolio design: Languages, Backend, Frontend, Databases, DevOps.
-- Existing rows are migrated, so this is safe on a database that already has data.
ALTER TABLE skill DROP CONSTRAINT ck_skill_category;
UPDATE skill SET category = 'BACKEND' WHERE category = 'FRAMEWORKS';
UPDATE skill SET category = 'DEVOPS'  WHERE category = 'TOOLS_DEVOPS';
ALTER TABLE skill ADD CONSTRAINT ck_skill_category
    CHECK (category IN ('LANGUAGES', 'BACKEND', 'FRONTEND', 'DATABASES', 'DEVOPS'));

-- Proficiency is optional: the design shows grouped skills, not levels, and we must not invent levels.
-- ck_skill_level (BETWEEN 1 AND 5) still applies to any value that is provided; NULL passes a CHECK.
ALTER TABLE skill ALTER COLUMN level DROP NOT NULL;
