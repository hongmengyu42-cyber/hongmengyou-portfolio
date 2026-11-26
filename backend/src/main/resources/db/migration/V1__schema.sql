-- =====================================================================
-- V1: initial schema. Flyway owns the schema; Hibernate only validates it.
-- Convention: every table has created_at / updated_at (timestamptz).
-- =====================================================================

CREATE TABLE admin_user (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email           VARCHAR(254) NOT NULL,
    password_hash   VARCHAR(100) NOT NULL,
    role            VARCHAR(20)  NOT NULL DEFAULT 'ADMIN',
    failed_attempts INT          NOT NULL DEFAULT 0,
    locked_until    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_admin_user_role CHECK (role IN ('ADMIN')),
    CONSTRAINT ck_admin_user_attempts CHECK (failed_attempts >= 0)
);
CREATE UNIQUE INDEX uq_admin_user_email_lower ON admin_user (lower(email));

-- Single-row table: the CHECK makes a second row impossible.
CREATE TABLE profile (
    id                   BIGINT PRIMARY KEY CHECK (id = 1),
    full_name            VARCHAR(100) NOT NULL,
    headline             VARCHAR(200) NOT NULL,
    intro                VARCHAR(500) NOT NULL DEFAULT '',
    background           TEXT         NOT NULL DEFAULT '',
    career_goals         TEXT         NOT NULL DEFAULT '',
    professional_summary TEXT         NOT NULL DEFAULT '',
    public_email         VARCHAR(254),
    github_url           VARCHAR(2048),
    linkedin_url         VARCHAR(2048),
    avatar_key           VARCHAR(80),
    avatar_alt           VARCHAR(200),
    cv_key               VARCHAR(80),
    seo_title            VARCHAR(70),
    seo_description      VARCHAR(200),
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_profile_github CHECK (github_url IS NULL OR github_url ~* '^https?://'),
    CONSTRAINT ck_profile_linkedin CHECK (linkedin_url IS NULL OR linkedin_url ~* '^https?://')
);

INSERT INTO profile (id, full_name, headline, intro)
VALUES (1, 'TODO_REPLACE Your Name', 'TODO_REPLACE Software Engineer',
        'TODO_REPLACE: one or two sentences introducing yourself.');

CREATE TABLE project (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name            VARCHAR(120)  NOT NULL,
    slug            VARCHAR(140)  NOT NULL,
    summary         VARCHAR(300)  NOT NULL,
    description     TEXT          NOT NULL,
    problem         TEXT,
    solution        TEXT,
    category        VARCHAR(30)   NOT NULL,
    status          VARCHAR(30)   NOT NULL,
    live_url        VARCHAR(2048),
    github_url      VARCHAR(2048),
    featured        BOOLEAN       NOT NULL DEFAULT FALSE,
    display_order   INT           NOT NULL DEFAULT 0,
    published       BOOLEAN       NOT NULL DEFAULT FALSE,
    link_status     VARCHAR(20)   NOT NULL DEFAULT 'UNKNOWN',
    link_checked_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT uq_project_slug UNIQUE (slug),
    CONSTRAINT ck_project_slug CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    CONSTRAINT ck_project_category CHECK (category IN ('WEB_APP', 'API', 'FULL_STACK', 'MOBILE', 'LIBRARY', 'OTHER')),
    CONSTRAINT ck_project_status CHECK (status IN ('LIVE', 'IN_DEVELOPMENT', 'ARCHIVED')),
    CONSTRAINT ck_project_link_status CHECK (link_status IN ('UNKNOWN', 'OK', 'BROKEN', 'BLOCKED')),
    -- Defense in depth: the application validates too, the database refuses javascript: etc.
    CONSTRAINT ck_project_live_url CHECK (live_url IS NULL OR live_url ~* '^https?://'),
    CONSTRAINT ck_project_github_url CHECK (github_url IS NULL OR github_url ~* '^https?://')
);
CREATE INDEX idx_project_listing ON project (published, category, display_order);
CREATE INDEX idx_project_published_order ON project (published, display_order);

CREATE TABLE project_feature (
    project_id BIGINT       NOT NULL REFERENCES project (id) ON DELETE CASCADE,
    sort_order INT          NOT NULL,
    feature    VARCHAR(200) NOT NULL,
    PRIMARY KEY (project_id, sort_order)
);

CREATE TABLE project_image (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id   BIGINT       NOT NULL REFERENCES project (id) ON DELETE CASCADE,
    file_key     VARCHAR(80)  NOT NULL,
    alt_text     VARCHAR(200) NOT NULL,
    is_thumbnail BOOLEAN      NOT NULL DEFAULT FALSE,
    sort_order   INT          NOT NULL DEFAULT 0,
    width        INT          NOT NULL,
    height       INT          NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_project_image_file UNIQUE (file_key),
    CONSTRAINT ck_project_image_size CHECK (width > 0 AND height > 0)
);
CREATE INDEX idx_project_image_project ON project_image (project_id, sort_order);
-- At most one thumbnail per project.
CREATE UNIQUE INDEX uq_project_image_thumbnail ON project_image (project_id) WHERE is_thumbnail;

CREATE TABLE technology (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name       VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_technology_name_lower ON technology (lower(name));

CREATE TABLE project_technology (
    project_id    BIGINT NOT NULL REFERENCES project (id) ON DELETE CASCADE,
    technology_id BIGINT NOT NULL REFERENCES technology (id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, technology_id)
);
CREATE INDEX idx_project_technology_tech ON project_technology (technology_id);

CREATE TABLE skill (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name          VARCHAR(60) NOT NULL,
    category      VARCHAR(30) NOT NULL,
    level         INT         NOT NULL,
    display_order INT         NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_skill_category CHECK (category IN ('LANGUAGES', 'FRAMEWORKS', 'DATABASES', 'TOOLS_DEVOPS')),
    CONSTRAINT ck_skill_level CHECK (level BETWEEN 1 AND 5)
);
CREATE INDEX idx_skill_category_order ON skill (category, display_order);

CREATE TABLE experience (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    company     VARCHAR(120) NOT NULL,
    role        VARCHAR(120) NOT NULL,
    location    VARCHAR(120),
    type        VARCHAR(20)  NOT NULL,
    start_date  DATE         NOT NULL,
    end_date    DATE,
    description TEXT         NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_experience_type CHECK (type IN ('WORK', 'INTERNSHIP', 'ACTIVITY')),
    CONSTRAINT ck_experience_dates CHECK (end_date IS NULL OR end_date >= start_date)
);
CREATE INDEX idx_experience_start ON experience (start_date DESC);

CREATE TABLE education (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    institution    VARCHAR(150) NOT NULL,
    degree         VARCHAR(150) NOT NULL,
    field_of_study VARCHAR(150),
    start_date     DATE         NOT NULL,
    end_date       DATE,
    description    TEXT         NOT NULL DEFAULT '',
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_education_dates CHECK (end_date IS NULL OR end_date >= start_date)
);
CREATE INDEX idx_education_start ON education (start_date DESC);

CREATE TABLE certification (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name           VARCHAR(150) NOT NULL,
    issuer         VARCHAR(120) NOT NULL,
    issued_on      DATE         NOT NULL,
    credential_url VARCHAR(2048),
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_certification_url CHECK (credential_url IS NULL OR credential_url ~* '^https?://')
);
CREATE INDEX idx_certification_issued ON certification (issued_on DESC);

CREATE TABLE contact_message (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(254) NOT NULL,
    subject    VARCHAR(150) NOT NULL,
    message    TEXT         NOT NULL,
    is_read    BOOLEAN      NOT NULL DEFAULT FALSE,
    ip_hash    VARCHAR(64)  NOT NULL,   -- HMAC of the client IP, never the raw address
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_contact_message_inbox ON contact_message (is_read, created_at DESC);
