-- DEV ONLY (loaded via spring.flyway.locations in the dev/test profiles).
-- Placeholder projects so you can see the layout. Everything marked TODO_REPLACE is fake on purpose.
-- Repeatable + idempotent: safe to re-run.

INSERT INTO project (name, slug, summary, description, problem, solution, category, status,
                     live_url, github_url, featured, display_order, published)
VALUES
('TODO_REPLACE Project One', 'todo-replace-project-one',
 'TODO_REPLACE: one-line summary of your first project.',
 'TODO_REPLACE: full description. Explain what it does, who it is for and how you built it.',
 'TODO_REPLACE: the problem this project solves.',
 'TODO_REPLACE: how your solution works.',
 'FULL_STACK', 'LIVE',
 'https://example.com/TODO_REPLACE/project-one', 'https://github.com/TODO_REPLACE/project-one',
 TRUE, 0, TRUE),
('TODO_REPLACE Project Two', 'todo-replace-project-two',
 'TODO_REPLACE: an API project that is still in development (no source button).',
 'TODO_REPLACE: full description.',
 NULL, NULL,
 'API', 'IN_DEVELOPMENT',
 'https://example.com/TODO_REPLACE/project-two', NULL,
 FALSE, 1, TRUE),
('TODO_REPLACE Project Three', 'todo-replace-project-three',
 'TODO_REPLACE: an archived web app.',
 'TODO_REPLACE: full description.',
 NULL, NULL,
 'WEB_APP', 'ARCHIVED',
 'https://example.com/TODO_REPLACE/project-three', 'https://github.com/TODO_REPLACE/project-three',
 FALSE, 2, TRUE)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO technology (name) VALUES ('Java'), ('Spring Boot'), ('PostgreSQL'), ('React'), ('Docker')
ON CONFLICT DO NOTHING;

INSERT INTO project_technology (project_id, technology_id)
SELECT p.id, t.id
FROM project p
JOIN technology t ON t.name IN ('Java', 'Spring Boot', 'PostgreSQL', 'React', 'Docker')
WHERE (p.slug = 'todo-replace-project-one')
   OR (p.slug = 'todo-replace-project-two' AND t.name IN ('Java', 'Spring Boot', 'PostgreSQL'))
   OR (p.slug = 'todo-replace-project-three' AND t.name IN ('React', 'Docker'))
ON CONFLICT DO NOTHING;
