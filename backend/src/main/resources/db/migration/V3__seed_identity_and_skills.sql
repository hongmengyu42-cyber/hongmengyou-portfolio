-- Real content supplied by the site owner (not placeholders). Everything is editable in the admin dashboard.
-- The profile update only runs while the profile still holds the V1 TODO_REPLACE defaults,
-- so it can never overwrite edits made later.
UPDATE profile
SET full_name = 'Hong Mengyou',
    headline  = 'Full-Stack Developer | Java Backend Developer | Year 4 IT Engineering Student',
    intro     = 'I build modern web applications and scalable backend systems using Java, Spring Boot, Laravel, React.js, and Next.js.'
WHERE id = 1 AND full_name LIKE 'TODO_REPLACE%';

INSERT INTO skill (name, category, level, display_order) VALUES
    ('Java',            'LANGUAGES', NULL, 0),
    ('Spring Boot',     'BACKEND',   NULL, 0),
    ('Spring Security', 'BACKEND',   NULL, 1),
    ('Laravel',         'BACKEND',   NULL, 2),
    ('REST APIs',       'BACKEND',   NULL, 3),
    ('React.js',        'FRONTEND',  NULL, 0),
    ('Next.js',         'FRONTEND',  NULL, 1),
    ('PostgreSQL',      'DATABASES', NULL, 0),
    ('Docker',          'DEVOPS',    NULL, 0),
    ('Git',             'DEVOPS',    NULL, 1),
    ('Maven',           'DEVOPS',    NULL, 2);
