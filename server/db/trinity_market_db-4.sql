-- ============================================================
-- Trinity Market DB — v1 simple (MVP)
-- Gestion du temps de travail, badgeage, RBAC, mono-organisation
-- Cible : PostgreSQL 15+ (testé sur 16)
-- ============================================================
-- Principes :
--   - Noms de tables en anglais proche du français.
--   - Colonnes en anglais simple (name, first_name, label, start_date,
--     end_date, status, reason, job_title, matricule).
--   - Périmètre MVP : auth, comptes/rôles, organisation/départements/équipes,
--     pointage simple, absences, planning, dashboard.
--   - Bonus hors v1 : code de pointage, score de confiance, mode dégradé,
--     multi-organisations, audit, RGPD, appareils, plages IP, OTP.
-- ============================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SEQUENCE IF NOT EXISTS matricule_seq;

-- ============================================================
-- 1. ORGANISATION (mono-tenant)
-- ============================================================
CREATE TABLE IF NOT EXISTS organisation (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code              VARCHAR(50)  NOT NULL UNIQUE,
    name              VARCHAR(255) NOT NULL,
    country           VARCHAR(100),
    country_code      CHAR(2)      NOT NULL DEFAULT 'FR',
    region_code       VARCHAR(30),
    timezone          VARCHAR(64)  NOT NULL DEFAULT 'Europe/Paris',
    email_domain      VARCHAR(255),
    microsoft_tenant_id VARCHAR(100),
    matricule_prefix  VARCHAR(10)  NOT NULL DEFAULT 'ORG',
    is_active         BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ
);

-- ============================================================
-- 2. STRUCTURE : DÉPARTEMENTS / ÉQUIPES
-- ============================================================
CREATE TABLE IF NOT EXISTS department (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        VARCHAR(50)  NOT NULL UNIQUE,
    name        VARCHAR(255) NOT NULL,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS team (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id  UUID NOT NULL REFERENCES department(id) ON DELETE RESTRICT,
    code           VARCHAR(50)  NOT NULL UNIQUE,
    name           VARCHAR(255) NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ
);

-- ============================================================
-- 3. RBAC : PROFILS / FEATURES
-- ============================================================
CREATE TABLE IF NOT EXISTS profile (
    id                INT4 PRIMARY KEY,
    code              VARCHAR(100) NOT NULL UNIQUE,
    label             VARCHAR(255) NOT NULL,
    hierarchy_level   INT2         NOT NULL DEFAULT 5,
    is_system         BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS feature (
    id          SERIAL4 PRIMARY KEY,
    code        VARCHAR(100) NOT NULL UNIQUE,
    label       VARCHAR(255) NOT NULL,
    module      VARCHAR(100),
    scope       VARCHAR(12)  NOT NULL DEFAULT 'NONE'
                CHECK (scope IN ('SELF','TEAM','DEPARTMENT','ALL','NONE')),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS profile_feature (
    profile_id  INT4 NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    feature_id  INT4 NOT NULL REFERENCES feature(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (profile_id, feature_id)
);

-- ============================================================
-- 4. COMPTES
-- ============================================================
CREATE TABLE IF NOT EXISTS "user" (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name            VARCHAR(100) NOT NULL,
    last_name             VARCHAR(100) NOT NULL,
    email                 VARCHAR(255) NOT NULL,
    phone                 VARCHAR(30),
    password_hash         TEXT,
    must_change_password  BOOLEAN      NOT NULL DEFAULT TRUE,
    auth_provider         VARCHAR(20)  NOT NULL DEFAULT 'PASSWORD'
                          CHECK (auth_provider IN ('PASSWORD','MICROSOFT','BOTH')),
    microsoft_oid         TEXT UNIQUE,
    invitation_status     VARCHAR(20)  NOT NULL DEFAULT 'NONE'
                          CHECK (invitation_status IN ('NONE','PENDING','ACCEPTED','EXPIRED')),
    invited_at            TIMESTAMPTZ,
    locale                VARCHAR(10)  NOT NULL DEFAULT 'fr',
    matricule             VARCHAR(30) UNIQUE,
    contract_type         VARCHAR(20)
                          CHECK (contract_type IN ('CDI','CDD','INTERIM','STAGE','PRESTATAIRE','AUTRE')),
    hire_date             DATE,
    departure_date        DATE,
    status                VARCHAR(20)  NOT NULL DEFAULT 'ACTIF'
                          CHECK (status IN ('ACTIF','SUSPENDU','SORTI')),
    last_login_at         TIMESTAMPTZ,
    is_active             BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ,
    CHECK (auth_provider = 'MICROSOFT' OR password_hash IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_email_ci ON "user" (lower(email));

CREATE TABLE IF NOT EXISTS user_profile (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    profile_id      INT4 NOT NULL REFERENCES profile(id) ON DELETE RESTRICT,
    order_priority  INT2 NOT NULL DEFAULT 1,
    start_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date        DATE,
    reason          VARCHAR(255),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ,
    CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS user_assignment (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    department_id  UUID NOT NULL REFERENCES department(id) ON DELETE RESTRICT,
    team_id        UUID REFERENCES team(id) ON DELETE SET NULL,
    job_title      VARCHAR(150),
    is_primary     BOOLEAN NOT NULL DEFAULT TRUE,
    start_date     DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date       DATE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ,
    CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS team_manager (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id     UUID NOT NULL REFERENCES team(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    start_date  DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date    DATE,
    reason      VARCHAR(255),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ,
    CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS department_manager (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id  UUID NOT NULL REFERENCES department(id) ON DELETE CASCADE,
    user_id        UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    start_date     DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date       DATE,
    reason         VARCHAR(255),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ,
    CHECK (end_date IS NULL OR end_date >= start_date)
);

-- ============================================================
-- 5. RÉGIMES / FÉRIÉS / TÉLÉTRAVAIL
-- ============================================================
CREATE TABLE IF NOT EXISTS work_schedule (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name               VARCHAR(150) NOT NULL,
    weekly_minutes     INT NOT NULL CHECK (weekly_minutes > 0),
    start_time         TIME,
    end_time           TIME,
    late_tolerance_min INT NOT NULL DEFAULT 15,
    annual_rtt_days    INT NOT NULL DEFAULT 0,
    is_forfait_days    BOOLEAN NOT NULL DEFAULT FALSE,
    is_active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS work_schedule_day (
    work_schedule_id  UUID NOT NULL REFERENCES work_schedule(id) ON DELETE CASCADE,
    iso_weekday       INT2 NOT NULL CHECK (iso_weekday BETWEEN 1 AND 7),
    PRIMARY KEY (work_schedule_id, iso_weekday)
);

CREATE TABLE IF NOT EXISTS work_schedule_assignment (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    work_schedule_id  UUID NOT NULL REFERENCES work_schedule(id) ON DELETE RESTRICT,
    start_date        DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date          DATE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ,
    CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS public_holiday (
    id            SERIAL4 PRIMARY KEY,
    scope         VARCHAR(20) NOT NULL CHECK (scope IN ('NATIONAL','REGIONAL','ENTREPRISE')),
    country_code  CHAR(2) NOT NULL DEFAULT 'FR',
    region_code   VARCHAR(30),
    day           DATE NOT NULL,
    label         VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_public_holiday_national
    ON public_holiday (country_code, day) WHERE scope = 'NATIONAL';
CREATE UNIQUE INDEX IF NOT EXISTS uq_public_holiday_regional
    ON public_holiday (country_code, region_code, day) WHERE scope = 'REGIONAL';
CREATE UNIQUE INDEX IF NOT EXISTS uq_public_holiday_company
    ON public_holiday (day) WHERE scope = 'ENTREPRISE';

CREATE TABLE IF NOT EXISTS public_holiday_exclusion (
    public_holiday_id  INT4 PRIMARY KEY REFERENCES public_holiday(id) ON DELETE CASCADE,
    reason             VARCHAR(255),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS telework_plan (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    iso_weekday   INT2 NOT NULL CHECK (iso_weekday BETWEEN 1 AND 7),
    start_date    DATE NOT NULL,
    end_date      DATE,
    validated_by  UUID REFERENCES "user"(id),
    validated_at  TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ,
    CHECK (end_date IS NULL OR end_date >= start_date)
);

-- ============================================================
-- 6. POINTAGE SIMPLE
-- ============================================================
CREATE TABLE IF NOT EXISTS clock_event (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    team_id          UUID REFERENCES team(id) ON DELETE SET NULL,
    type             VARCHAR(10) NOT NULL CHECK (type IN ('ENTREE','SORTIE')),
    work_mode        VARCHAR(10) NOT NULL DEFAULT 'BUREAU'
                     CHECK (work_mode IN ('BUREAU','REMOTE')),
    occurred_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    declared_at      TIMESTAMPTZ,
    source           VARCHAR(10) NOT NULL DEFAULT 'APP' CHECK (source IN ('APP','WEB')),
    status           VARCHAR(30) NOT NULL DEFAULT 'VALIDE'
                     CHECK (status IN ('VALIDE','EN_ATTENTE_VALIDATION','REJETE','CORRIGE')),
    validated_by     UUID REFERENCES "user"(id),
    validated_at     TIMESTAMPTZ,
    validation_note  TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 7. ABSENCES / SOLDES
-- ============================================================
CREATE TABLE IF NOT EXISTS absence_type (
    id           SERIAL4 PRIMARY KEY,
    code         VARCHAR(50) NOT NULL UNIQUE,
    label        VARCHAR(255) NOT NULL,
    has_counter  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS absence (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    type_id          INT4 NOT NULL REFERENCES absence_type(id) ON DELETE RESTRICT,
    start_date       DATE NOT NULL,
    end_date         DATE NOT NULL,
    reason           VARCHAR(255),
    status           VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE'
                     CHECK (status IN ('EN_ATTENTE','APPROUVEE','REFUSEE')),
    days_count       INT,
    decided_by       UUID REFERENCES "user"(id),
    decided_at       TIMESTAMPTZ,
    decision_reason  TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ,
    CHECK (end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS absence_day (
    absence_id  UUID NOT NULL REFERENCES absence(id) ON DELETE CASCADE,
    day         DATE NOT NULL,
    PRIMARY KEY (absence_id, day)
);

CREATE TABLE IF NOT EXISTS leave_balance (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    type_id          INT4 NOT NULL REFERENCES absence_type(id) ON DELETE RESTRICT,
    period           VARCHAR(10) NOT NULL,
    acquired_days    NUMERIC(6,2) NOT NULL DEFAULT 0,
    adjustment_days  NUMERIC(6,2) NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ,
    UNIQUE (user_id, type_id, period)
);

-- ============================================================
-- 8. ANOMALIES / CORRECTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS anomaly (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    anomaly_date      DATE NOT NULL,
    type              VARCHAR(50) NOT NULL,
    clock_event_id    UUID REFERENCES clock_event(id) ON DELETE SET NULL,
    status            VARCHAR(20) NOT NULL DEFAULT 'OUVERTE'
                      CHECK (status IN ('OUVERTE','A_JUSTIFIER','RESOLUE')),
    absence_type_id   INT4 REFERENCES absence_type(id) ON DELETE SET NULL,
    employee_comment  TEXT,
    justified_at      TIMESTAMPTZ,
    decided_by        UUID REFERENCES "user"(id),
    decided_at        TIMESTAMPTZ,
    detail            TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS correction_request (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    anomaly_id          UUID REFERENCES anomaly(id) ON DELETE SET NULL,
    work_date           DATE NOT NULL,
    proposed_entry_at   TIMESTAMPTZ,
    proposed_exit_at    TIMESTAMPTZ,
    work_mode           VARCHAR(10) CHECK (work_mode IN ('BUREAU','REMOTE')),
    reason              VARCHAR(255),
    replaces_entry_id   UUID REFERENCES clock_event(id) ON DELETE SET NULL,
    replaces_exit_id    UUID REFERENCES clock_event(id) ON DELETE SET NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE'
                        CHECK (status IN ('EN_ATTENTE','APPROUVEE','REFUSEE')),
    decided_by          UUID REFERENCES "user"(id),
    decided_at          TIMESTAMPTZ,
    decision_note       TEXT,
    created_entry_id    UUID REFERENCES clock_event(id) ON DELETE SET NULL,
    created_exit_id     UUID REFERENCES clock_event(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ
);

-- ============================================================
-- 9. NOTIFICATIONS / CONFIG
-- ============================================================
CREATE TABLE IF NOT EXISTS notification (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    type        VARCHAR(50) NOT NULL,
    title       VARCHAR(255) NOT NULL,
    message     TEXT,
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    read_at     TIMESTAMPTZ,
    data        JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_config (
    id           SERIAL4 PRIMARY KEY,
    config_key   VARCHAR(100) NOT NULL UNIQUE,
    value        TEXT NOT NULL,
    module       VARCHAR(50),
    description  TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ
);

-- ============================================================
-- 9.b SOFT DELETE (restauré — même périmètre que la v3)
-- Les tables immuables / de jointure n'ont pas ces colonnes :
-- clock_event, absence_day, work_schedule_day, public_holiday_exclusion,
-- leave_balance, anomaly, notification.
-- ============================================================
DO $$
DECLARE t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'organisation','department','team','profile','feature','profile_feature',
        'user','user_profile','user_assignment','team_manager','department_manager',
        'work_schedule','work_schedule_assignment','public_holiday','telework_plan',
        'absence_type','absence','correction_request','app_config'
    ] LOOP
        EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ', t);
        EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE', t);
    END LOOP;
END $$;

-- ============================================================
-- 10. INDEX
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_team_department              ON team(department_id);
CREATE INDEX IF NOT EXISTS idx_user_profile_user            ON user_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profile_profile         ON user_profile(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_assignment_user         ON user_assignment(user_id);
CREATE INDEX IF NOT EXISTS idx_user_assignment_department   ON user_assignment(department_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_team_manager_team            ON team_manager(team_id);
CREATE INDEX IF NOT EXISTS idx_team_manager_user            ON team_manager(user_id);
CREATE INDEX IF NOT EXISTS idx_department_manager_department ON department_manager(department_id);
CREATE INDEX IF NOT EXISTS idx_work_schedule_assignment_user ON work_schedule_assignment(user_id, start_date);
CREATE INDEX IF NOT EXISTS idx_public_holiday_day           ON public_holiday(day);
CREATE INDEX IF NOT EXISTS idx_telework_user                ON telework_plan(user_id, start_date);
CREATE INDEX IF NOT EXISTS idx_clock_event_user_date        ON clock_event(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_clock_event_team_date        ON clock_event(team_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_clock_event_status           ON clock_event(status) WHERE status = 'EN_ATTENTE_VALIDATION';
CREATE INDEX IF NOT EXISTS idx_absence_user_date            ON absence(user_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_absence_status               ON absence(status);
CREATE INDEX IF NOT EXISTS idx_absence_day_day              ON absence_day(day);
CREATE INDEX IF NOT EXISTS idx_leave_balance_user           ON leave_balance(user_id, period);
CREATE INDEX IF NOT EXISTS idx_anomaly_user_date            ON anomaly(user_id, anomaly_date);
CREATE INDEX IF NOT EXISTS idx_anomaly_status               ON anomaly(status);
CREATE INDEX IF NOT EXISTS idx_correction_status            ON correction_request(status);
CREATE INDEX IF NOT EXISTS idx_notification_user_read       ON notification(user_id, is_read);

-- ============================================================
-- 11. FONCTIONS SIMPLES
-- ============================================================
CREATE OR REPLACE FUNCTION fn_is_holiday(p_day DATE)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public_holiday h
        JOIN organisation o ON TRUE
        WHERE h.day = p_day
          AND h.is_deleted = FALSE
          AND o.is_deleted = FALSE
          AND (
              h.scope IN ('NATIONAL','ENTREPRISE')
              OR (h.scope = 'REGIONAL' AND h.region_code = o.region_code)
          )
          AND NOT EXISTS (
              SELECT 1 FROM public_holiday_exclusion e WHERE e.public_holiday_id = h.id
          )
    );
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION fn_generate_absence_days(p_absence_id UUID)
RETURNS INT AS $$
DECLARE
    v_count INT;
BEGIN
    INSERT INTO absence_day (absence_id, day)
    SELECT p_absence_id, d::date
    FROM generate_series(
        (SELECT start_date FROM absence WHERE id = p_absence_id AND is_deleted = FALSE),
        (SELECT end_date   FROM absence WHERE id = p_absence_id AND is_deleted = FALSE),
        interval '1 day'
    ) d
    WHERE EXTRACT(ISODOW FROM d) < 6
      AND NOT fn_is_holiday(d::date)
    ON CONFLICT DO NOTHING;

    SELECT count(*) INTO v_count FROM absence_day WHERE absence_id = p_absence_id;
    UPDATE absence SET days_count = v_count WHERE id = p_absence_id;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_expected_work_mode(p_user_id UUID, p_at TIMESTAMPTZ DEFAULT now())
RETURNS VARCHAR(10) AS $$
    SELECT CASE WHEN EXISTS (
        SELECT 1
        FROM telework_plan t
        WHERE t.user_id = p_user_id
          AND t.iso_weekday = EXTRACT(ISODOW FROM p_at)
          AND p_at::date BETWEEN t.start_date AND COALESCE(t.end_date, 'infinity'::date)
          AND t.validated_at IS NOT NULL
          AND t.is_deleted = FALSE
    ) THEN 'REMOTE' ELSE 'BUREAU' END;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION fn_record_clock_event(p_user_id UUID, p_type TEXT)
RETURNS clock_event AS $$
DECLARE
    v_team     UUID;
    v_last_in  TIMESTAMPTZ;
    v_last_out TIMESTAMPTZ;
    v_event    clock_event;
BEGIN
    IF p_type NOT IN ('ENTREE','SORTIE') THEN
        RAISE EXCEPTION 'TYPE_INVALIDE';
    END IF;

    SELECT team_id INTO v_team
    FROM user_assignment
    WHERE user_id = p_user_id AND is_primary AND end_date IS NULL AND is_deleted = FALSE
    ORDER BY start_date DESC
    LIMIT 1;

    SELECT max(occurred_at) INTO v_last_in
    FROM clock_event
    WHERE user_id = p_user_id AND type = 'ENTREE' AND status <> 'REJETE';

    SELECT max(occurred_at) INTO v_last_out
    FROM clock_event
    WHERE user_id = p_user_id AND type = 'SORTIE' AND status <> 'REJETE';

    IF p_type = 'ENTREE' AND v_last_in IS NOT NULL
       AND (v_last_out IS NULL OR v_last_in > v_last_out) THEN
        RAISE EXCEPTION 'POINTAGE_ALREADY_OPEN';
    END IF;

    IF p_type = 'SORTIE' AND (v_last_in IS NULL OR v_last_in <= COALESCE(v_last_out, 'epoch'::timestamptz)) THEN
        RAISE EXCEPTION 'POINTAGE_NO_OPEN_SESSION';
    END IF;

    INSERT INTO clock_event (user_id, team_id, type, work_mode, occurred_at, source, status)
    VALUES (p_user_id, v_team, p_type, fn_expected_work_mode(p_user_id), now(), 'APP', 'VALIDE')
    RETURNING * INTO v_event;

    RETURN v_event;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_next_matricule(p_prefix TEXT)
RETURNS TEXT AS $$
    SELECT p_prefix || '-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('matricule_seq')::text, 5, '0');
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION fn_validate_user_email_domain()
RETURNS trigger AS $$
DECLARE
    v_domain TEXT;
BEGIN
    SELECT email_domain INTO v_domain FROM organisation LIMIT 1;
    IF v_domain IS NOT NULL
       AND lower(split_part(NEW.email, '@', 2)) <> lower(v_domain) THEN
        RAISE EXCEPTION 'EMAIL_DOMAIN_NOT_ALLOWED';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_email_domain ON "user";
CREATE TRIGGER trg_user_email_domain
BEFORE INSERT OR UPDATE OF email ON "user"
FOR EACH ROW EXECUTE FUNCTION fn_validate_user_email_domain();

-- ============================================================
-- 12. VUES
-- ============================================================
CREATE OR REPLACE VIEW v_user_profiles_active AS
SELECT
    u.id AS user_id,
    u.first_name,
    u.last_name,
    u.email,
    p.id AS profile_id,
    p.code AS profile_code,
    p.label AS profile_label,
    p.hierarchy_level,
    up.start_date,
    up.end_date
FROM "user" u
JOIN user_profile up ON up.user_id = u.id AND up.end_date IS NULL AND up.is_active AND up.is_deleted = FALSE
JOIN profile p ON p.id = up.profile_id AND p.is_deleted = FALSE
WHERE u.is_active AND u.is_deleted = FALSE;

CREATE OR REPLACE VIEW v_profile_features AS
SELECT
    p.id AS profile_id,
    p.code AS profile_code,
    f.id AS feature_id,
    f.code AS feature_code,
    f.label,
    f.scope
FROM profile p
JOIN profile_feature pf ON pf.profile_id = p.id AND pf.is_deleted = FALSE
JOIN feature f ON f.id = pf.feature_id AND f.is_deleted = FALSE
WHERE p.is_deleted = FALSE;

CREATE OR REPLACE VIEW v_clock_sessions AS
WITH ordered AS (
    SELECT ce.*,
           row_number() OVER (
               PARTITION BY user_id, occurred_at::date
               ORDER BY occurred_at, id
           ) AS rn
    FROM clock_event ce
    WHERE ce.status <> 'REJETE'
)
SELECT
    e.user_id,
    e.team_id,
    e.occurred_at::date AS work_date,
    e.occurred_at AS entry_at,
    s.occurred_at AS exit_at,
    CASE WHEN s.id IS NULL THEN NULL
         ELSE round(extract(epoch FROM (s.occurred_at - e.occurred_at)) / 60)::int
    END AS minutes,
    CASE WHEN s.id IS NULL THEN 'OPEN' ELSE 'COMPLETE' END AS status,
    e.work_mode
FROM ordered e
LEFT JOIN ordered s
    ON s.user_id = e.user_id
   AND s.occurred_at::date = e.occurred_at::date
   AND s.type = 'SORTIE'
   AND s.rn = e.rn + 1
WHERE e.type = 'ENTREE';

CREATE OR REPLACE VIEW v_clock_events_to_validate AS
SELECT ce.*, u.first_name, u.last_name
FROM clock_event ce
JOIN "user" u ON u.id = ce.user_id
WHERE ce.status = 'EN_ATTENTE_VALIDATION' AND u.is_deleted = FALSE;

CREATE OR REPLACE VIEW v_leave_balances AS
SELECT
    lb.user_id,
    at.code AS type_code,
    at.label,
    lb.period,
    lb.acquired_days + lb.adjustment_days AS total_days,
    COALESCE(SUM(CASE WHEN a.status = 'APPROUVEE' THEN a.days_count ELSE 0 END), 0) AS used_days,
    lb.acquired_days + lb.adjustment_days
      - COALESCE(SUM(CASE WHEN a.status = 'APPROUVEE' THEN a.days_count ELSE 0 END), 0) AS remaining_days
FROM leave_balance lb
JOIN absence_type at ON at.id = lb.type_id AND at.is_deleted = FALSE
LEFT JOIN absence a
    ON a.user_id = lb.user_id
   AND a.type_id = lb.type_id
   AND to_char(a.start_date, 'YYYY') = lb.period
   AND a.is_deleted = FALSE
GROUP BY lb.user_id, at.code, at.label, lb.period, lb.acquired_days, lb.adjustment_days;

-- ============================================================
-- 13. SEED — ORGANISATION / RBAC
-- ============================================================
INSERT INTO organisation (id, code, name, country, country_code, region_code, timezone, matricule_prefix, email_domain, microsoft_tenant_id) VALUES
    ('11111111-1111-1111-1111-111111111111', 'TRINITY', 'Trinity Market', 'France', 'FR', 'FR-ALSACE-MOSELLE', 'Europe/Paris', 'TM', 'trinity-market.example', 'common')
ON CONFLICT (id) DO NOTHING;

INSERT INTO profile (id, code, label, hierarchy_level, is_system) VALUES
    (1, 'EMPLOYEE', 'Employee',               5, TRUE),
    (2, 'MANAGER',  'Team Manager',           3, TRUE),
    (3, 'HR',       'Human Resources',        3, FALSE),
    (4, 'DIRECTOR', 'Department Director',    2, FALSE),
    (5, 'CEO',      'Chief Executive Officer',1, FALSE),
    (6, 'SUPER_ADMIN', 'Platform Super Administrator', 1, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO feature (code, label, module, scope) VALUES
    ('AUTH_LOGIN',              'Se connecter',                              'AUTH',      'NONE'),
    ('AUTH_CHANGE_PASSWORD',    'Changer son mot de passe',                  'AUTH',      'NONE'),
    ('AUTH_SWITCH_PROFILE',     'Changer de profil actif',                   'AUTH',      'NONE'),
    ('POINTAGE_BADGER',         'Badger entrée / sortie',                    'POINTAGE',  'SELF'),
    ('POINTAGE_READ_OWN',       'Voir ses pointages',                        'POINTAGE',  'SELF'),
    ('POINTAGE_CORRECTION_REQUEST', 'Demander une correction de pointage',   'POINTAGE',  'SELF'),
    ('POINTAGE_READ_TEAM',      'Voir les pointages de l’équipe',            'POINTAGE',  'TEAM'),
    ('POINTAGE_READ_DEPT',      'Voir les pointages du département',         'POINTAGE',  'DEPARTMENT'),
    ('POINTAGE_READ_ALL',       'Voir tous les pointages',                   'POINTAGE',  'ALL'),
    ('POINTAGE_VALIDATE_TEAM',  'Valider les pointages de l’équipe',         'POINTAGE',  'TEAM'),
    ('POINTAGE_VALIDATE_ALL',   'Valider tous les pointages',                'POINTAGE',  'ALL'),
    ('POINTAGE_CORRECT_TEAM',   'Traiter les corrections de l’équipe',       'POINTAGE',  'TEAM'),
    ('POINTAGE_CORRECT_ALL',    'Traiter toutes les corrections',            'POINTAGE',  'ALL'),
    ('POINTAGE_EXPORT_TEAM',    'Exporter les pointages de l’équipe',        'POINTAGE',  'TEAM'),
    ('POINTAGE_EXPORT_DEPT',    'Exporter les pointages du département',     'POINTAGE',  'DEPARTMENT'),
    ('POINTAGE_EXPORT_ALL',     'Exporter tous les pointages',               'POINTAGE',  'ALL'),
    ('KPI_READ_SELF',           'Voir ses indicateurs',                      'KPI',       'SELF'),
    ('KPI_READ_TEAM',           'Voir les indicateurs de l’équipe',          'KPI',       'TEAM'),
    ('KPI_READ_DEPT',           'Voir les indicateurs du département',       'KPI',       'DEPARTMENT'),
    ('KPI_READ_ALL',            'Voir les indicateurs de l’organisation',    'KPI',       'ALL'),
    ('SCHEDULE_READ_OWN',       'Voir son régime de travail',                'SCHEDULE',  'SELF'),
    ('SCHEDULE_MANAGE',         'Gérer les régimes de travail',              'SCHEDULE',  'ALL'),
    ('HOLIDAY_MANAGE',          'Gérer les jours fériés',                    'SCHEDULE',  'NONE'),
    ('TELEWORK_READ_OWN',       'Voir son télétravail',                      'SCHEDULE',  'SELF'),
    ('TELEWORK_VALIDATE_TEAM',  'Valider le télétravail de l’équipe',        'SCHEDULE',  'TEAM'),
    ('ABSENCE_REQUEST',         'Demander une absence',                      'ABSENCE',   'SELF'),
    ('ABSENCE_READ_OWN',        'Voir ses absences',                         'ABSENCE',   'SELF'),
    ('ABSENCE_READ_TEAM',       'Voir les absences de l’équipe',             'ABSENCE',   'TEAM'),
    ('ABSENCE_READ_DEPT',       'Voir les absences du département',          'ABSENCE',   'DEPARTMENT'),
    ('ABSENCE_READ_ALL',        'Voir toutes les absences',                  'ABSENCE',   'ALL'),
    ('ABSENCE_APPROVE_TEAM',    'Approuver les absences de l’équipe',        'ABSENCE',   'TEAM'),
    ('ABSENCE_APPROVE_DEPT',    'Approuver les absences du département',     'ABSENCE',   'DEPARTMENT'),
    ('ABSENCE_APPROVE_ALL',     'Approuver toutes les absences',             'ABSENCE',   'ALL'),
    ('LEAVE_BALANCE_MANAGE',    'Gérer les soldes de congés',                'ABSENCE',   'ALL'),
    ('ANOMALY_READ_OWN',        'Voir ses anomalies',                        'ANOMALY',   'SELF'),
    ('ANOMALY_JUSTIFY',         'Justifier une anomalie',                    'ANOMALY',   'SELF'),
    ('ANOMALY_MANAGE_TEAM',     'Traiter les anomalies de l’équipe',         'ANOMALY',   'TEAM'),
    ('ANOMALY_MANAGE_DEPT',     'Traiter les anomalies du département',      'ANOMALY',   'DEPARTMENT'),
    ('ANOMALY_MANAGE_ALL',      'Traiter toutes les anomalies',              'ANOMALY',   'ALL'),
    ('TEAM_MANAGE',             'Gérer ses équipes',                         'ADMIN',     'TEAM'),
    ('ADMIN_MANAGE_USERS',      'Gérer les comptes',                         'ADMIN',     'NONE'),
    ('ADMIN_ASSIGN_PROFILE',    'Assigner des profils',                      'ADMIN',     'NONE'),
    ('ADMIN_MANAGE_STRUCTURE',  'Gérer départements et équipes',             'ADMIN',     'NONE'),
    ('ADMIN_MANAGE_FEATURES',   'Gérer les droits des profils',              'ADMIN',     'NONE'),
    ('ADMIN_MANAGE_CONFIG',     'Gérer la configuration',                    'ADMIN',     'NONE')
ON CONFLICT (code) DO NOTHING;

WITH e AS (
    SELECT ARRAY[
        'AUTH_LOGIN','AUTH_CHANGE_PASSWORD','AUTH_SWITCH_PROFILE',
        'POINTAGE_BADGER','POINTAGE_READ_OWN','POINTAGE_CORRECTION_REQUEST','KPI_READ_SELF',
        'SCHEDULE_READ_OWN','TELEWORK_READ_OWN',
        'ABSENCE_REQUEST','ABSENCE_READ_OWN',
        'ANOMALY_READ_OWN','ANOMALY_JUSTIFY'
    ] AS a
), m AS (
    SELECT e.a || ARRAY[
        'POINTAGE_READ_TEAM','POINTAGE_VALIDATE_TEAM','POINTAGE_CORRECT_TEAM','POINTAGE_EXPORT_TEAM',
        'KPI_READ_TEAM','TELEWORK_VALIDATE_TEAM',
        'ABSENCE_READ_TEAM','ABSENCE_APPROVE_TEAM',
        'ANOMALY_MANAGE_TEAM','TEAM_MANAGE'
    ] AS a FROM e
), d AS (
    SELECT m.a || ARRAY[
        'POINTAGE_READ_DEPT','POINTAGE_EXPORT_DEPT','KPI_READ_DEPT',
        'ABSENCE_READ_DEPT','ABSENCE_APPROVE_DEPT','ANOMALY_MANAGE_DEPT'
    ] AS a FROM m
), h AS (
    SELECT e.a || ARRAY[
        'POINTAGE_READ_ALL','POINTAGE_VALIDATE_ALL','POINTAGE_CORRECT_ALL','POINTAGE_EXPORT_ALL',
        'KPI_READ_ALL','SCHEDULE_MANAGE','HOLIDAY_MANAGE',
        'ABSENCE_READ_ALL','ABSENCE_APPROVE_ALL','LEAVE_BALANCE_MANAGE',
        'ANOMALY_MANAGE_ALL',
        'ADMIN_MANAGE_USERS','ADMIN_ASSIGN_PROFILE','ADMIN_MANAGE_STRUCTURE',
        'ADMIN_MANAGE_FEATURES','ADMIN_MANAGE_CONFIG'
    ] AS a FROM e
), c AS (
    SELECT e.a || ARRAY[
        'POINTAGE_READ_ALL','POINTAGE_EXPORT_ALL','KPI_READ_ALL',
        'ABSENCE_READ_ALL','ABSENCE_APPROVE_ALL','ANOMALY_MANAGE_ALL',
        'ADMIN_ASSIGN_PROFILE','ADMIN_MANAGE_CONFIG'
    ] AS a FROM e
), sa AS (
    SELECT ARRAY[
        'AUTH_LOGIN','AUTH_CHANGE_PASSWORD','AUTH_SWITCH_PROFILE',
        'ADMIN_MANAGE_USERS','ADMIN_ASSIGN_PROFILE','ADMIN_MANAGE_STRUCTURE',
        'ADMIN_MANAGE_FEATURES','ADMIN_MANAGE_CONFIG',
        'SCHEDULE_MANAGE','HOLIDAY_MANAGE'
    ] AS a
), sets AS (
    SELECT 1 AS pid, e.a AS codes FROM e
    UNION ALL SELECT 2, m.a FROM m
    UNION ALL SELECT 3, h.a FROM h
    UNION ALL SELECT 4, d.a FROM d
    UNION ALL SELECT 5, c.a FROM c
    UNION ALL SELECT 6, sa.a FROM sa
)
INSERT INTO profile_feature (profile_id, feature_id)
SELECT s.pid, f.id
FROM sets s
CROSS JOIN LATERAL unnest(s.codes) AS c(code)
JOIN feature f ON f.code = c.code
ON CONFLICT DO NOTHING;

-- ============================================================
-- 14. SEED — STRUCTURE / COMPTES
-- ============================================================
INSERT INTO department (id, code, name) VALUES
    ('33333333-3333-3333-3333-333333333331', 'HR',  'Ressources Humaines'),
    ('33333333-3333-3333-3333-333333333332', 'FIN', 'Finance'),
    ('33333333-3333-3333-3333-333333333333', 'IT',  'IT'),
    ('33333333-3333-3333-3333-333333333334', 'OPS', 'Opérations'),
    ('33333333-3333-3333-3333-333333333335', 'CS',  'Service Client')
ON CONFLICT (id) DO NOTHING;

INSERT INTO team (id, department_id, code, name) VALUES
    ('44444444-4444-4444-4444-444444444441', '33333333-3333-3333-3333-333333333333', 'IT-PLAT',    'IT — Plateforme'),
    ('44444444-4444-4444-4444-444444444442', '33333333-3333-3333-3333-333333333332', 'FIN-COMPTA', 'Finance — Comptabilité'),
    ('44444444-4444-4444-4444-444444444443', '33333333-3333-3333-3333-333333333335', 'CS-N1',      'Service Client — Niveau 1'),
    ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333334', 'OPS-LOG',    'Opérations — Logistique')
ON CONFLICT (id) DO NOTHING;

INSERT INTO "user" (id, first_name, last_name, email, auth_provider, microsoft_oid, password_hash, must_change_password, matricule, contract_type, hire_date, status) VALUES
    ('55555555-5555-5555-5555-555555555501', 'Super',  'Admin',  'superadmin@trinity-market.example',   'BOTH', '00000000-0000-0000-0000-000000000501', '$argon2id$HASH_SA',   FALSE, 'TM-2026-00000', 'CDI', '2026-01-01', 'ACTIF'),
    ('55555555-5555-5555-5555-555555555502', 'Claire', 'Martin', 'pdg@trinity-market.example',          'BOTH', '00000000-0000-0000-0000-000000000502', '$argon2id$HASH_CEO',  FALSE, 'TM-2015-00001', 'CDI', '2015-01-05', 'ACTIF'),
    ('55555555-5555-5555-5555-555555555503', 'Hugo',   'Bernard','hugo.bernard@trinity-market.example', 'BOTH', '00000000-0000-0000-0000-000000000503', '$argon2id$HASH_DIR',  FALSE, 'TM-2018-00102', 'CDI', '2018-03-01', 'ACTIF'),
    ('55555555-5555-5555-5555-555555555504', 'Sofia',  'Lopez',  'sofia.lopez@trinity-market.example',  'BOTH', '00000000-0000-0000-0000-000000000504', '$argon2id$HASH_MGR',  FALSE, 'TM-2019-00215', 'CDI', '2019-09-02', 'ACTIF'),
    ('55555555-5555-5555-5555-555555555505', 'Karim',  'Benali', 'karim.benali@trinity-market.example', 'BOTH', '00000000-0000-0000-0000-000000000505', '$argon2id$HASH_MGR2', FALSE, 'TM-2020-00320', 'CDI', '2020-02-17', 'ACTIF'),
    ('55555555-5555-5555-5555-555555555506', 'Léa',    'Dubois', 'lea.dubois@trinity-market.example',   'BOTH', '00000000-0000-0000-0000-000000000506', '$argon2id$HASH_LEA',  TRUE,  'TM-2024-00584', 'CDI', '2024-06-03', 'ACTIF'),
    ('55555555-5555-5555-5555-555555555507', 'Yanis',  'Petit',  'yanis.petit@trinity-market.example',  'BOTH', '00000000-0000-0000-0000-000000000507', '$argon2id$HASH_YANIS',FALSE, 'TM-2025-00612', 'CDD', '2025-11-03', 'ACTIF'),
    ('55555555-5555-5555-5555-555555555508', 'Nadia',  'Roux',   'nadia.roux@trinity-market.example',   'BOTH', '00000000-0000-0000-0000-000000000508', '$argon2id$HASH_HR',   FALSE, 'TM-2018-00150', 'CDI', '2018-10-01', 'ACTIF'),
    ('55555555-5555-5555-5555-555555555509', 'Omar',   'Diallo', 'omar.diallo@trinity-market.example',  'BOTH', '00000000-0000-0000-0000-000000000509', '$argon2id$HASH_OMAR', FALSE, 'TM-2024-00590', 'CDI', '2024-06-03', 'ACTIF'),
    ('55555555-5555-5555-5555-555555555510', 'Inès',   'Moreau', 'ines.moreau@trinity-market.example',  'BOTH', '00000000-0000-0000-0000-000000000510', '$argon2id$HASH_INES', FALSE, 'TM-2025-00640', 'CDI', '2025-09-01', 'ACTIF')
ON CONFLICT (id) DO NOTHING;

UPDATE "user" SET invitation_status='ACCEPTED', invited_at=now() WHERE microsoft_oid IS NOT NULL;

INSERT INTO user_profile (id, user_id, profile_id, order_priority, start_date, end_date, reason) VALUES
    ('a3000000-0000-0000-0000-000000000001', '55555555-5555-5555-5555-555555555502', 5, 1, '2026-01-01', NULL, NULL),
    ('a3000000-0000-0000-0000-000000000002', '55555555-5555-5555-5555-555555555503', 4, 1, '2026-01-01', NULL, NULL),
    ('a3000000-0000-0000-0000-000000000003', '55555555-5555-5555-5555-555555555504', 2, 1, '2026-01-01', NULL, NULL),
    ('a3000000-0000-0000-0000-000000000004', '55555555-5555-5555-5555-555555555505', 2, 1, '2026-03-01', NULL, 'Promotion responsable support N1'),
    ('a3000000-0000-0000-0000-000000000005', '55555555-5555-5555-5555-555555555505', 1, 2, '2026-01-01', NULL, NULL),
    ('a3000000-0000-0000-0000-000000000006', '55555555-5555-5555-5555-555555555506', 1, 1, '2026-01-01', NULL, NULL),
    ('a3000000-0000-0000-0000-000000000007', '55555555-5555-5555-5555-555555555507', 1, 1, '2026-01-01', NULL, NULL),
    ('a3000000-0000-0000-0000-000000000008', '55555555-5555-5555-5555-555555555507', 2, 2, '2026-10-01', '2026-10-31', 'Intérim — congé de Sofia'),
    ('a3000000-0000-0000-0000-000000000009', '55555555-5555-5555-5555-555555555508', 3, 1, '2026-01-01', NULL, NULL),
    ('a3000000-0000-0000-0000-000000000010', '55555555-5555-5555-5555-555555555509', 1, 1, '2026-01-01', NULL, NULL),
    ('a3000000-0000-0000-0000-000000000011', '55555555-5555-5555-5555-555555555510', 1, 1, '2026-01-01', NULL, NULL),
    ('a3000000-0000-0000-0000-000000000012', '55555555-5555-5555-5555-555555555501', 6, 1, '2026-01-01', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_assignment (id, user_id, department_id, team_id, job_title, start_date) VALUES
    ('a1000000-0000-0000-0000-000000000003', '55555555-5555-5555-5555-555555555503', '33333333-3333-3333-3333-333333333333', NULL,                                     'Directeur IT',          '2018-03-01'),
    ('a1000000-0000-0000-0000-000000000004', '55555555-5555-5555-5555-555555555504', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444441', 'Responsable plateforme', '2019-09-02'),
    ('a1000000-0000-0000-0000-000000000005', '55555555-5555-5555-5555-555555555505', '33333333-3333-3333-3333-333333333335', '44444444-4444-4444-4444-444444444443', 'Responsable support N1', '2020-02-17'),
    ('a1000000-0000-0000-0000-000000000006', '55555555-5555-5555-5555-555555555506', '33333333-3333-3333-3333-333333333335', '44444444-4444-4444-4444-444444444443', 'Conseillère client',    '2024-06-03'),
    ('a1000000-0000-0000-0000-000000000007', '55555555-5555-5555-5555-555555555507', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444441', 'Développeur',           '2025-11-03'),
    ('a1000000-0000-0000-0000-000000000008', '55555555-5555-5555-5555-555555555508', '33333333-3333-3333-3333-333333333331', NULL,                                     'Responsable RH',        '2018-10-01'),
    ('a1000000-0000-0000-0000-000000000009', '55555555-5555-5555-5555-555555555509', '33333333-3333-3333-3333-333333333335', '44444444-4444-4444-4444-444444444443', 'Conseiller client',     '2024-06-03'),
    ('a1000000-0000-0000-0000-000000000010', '55555555-5555-5555-5555-555555555510', '33333333-3333-3333-3333-333333333335', '44444444-4444-4444-4444-444444444443', 'Conseillère client',    '2025-09-01')
ON CONFLICT (id) DO NOTHING;

INSERT INTO team_manager (id, team_id, user_id, start_date, end_date, reason) VALUES
    ('a6000000-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444441', '55555555-5555-5555-5555-555555555504', '2019-09-02', NULL, NULL),
    ('a6000000-0000-0000-0000-000000000002', '44444444-4444-4444-4444-444444444443', '55555555-5555-5555-5555-555555555505', '2026-03-01', NULL, 'Promotion responsable support N1'),
    ('a6000000-0000-0000-0000-000000000003', '44444444-4444-4444-4444-444444444441', '55555555-5555-5555-5555-555555555507', '2026-10-01', '2026-10-31', 'Intérim — congé de Sofia')
ON CONFLICT (id) DO NOTHING;

INSERT INTO department_manager (id, department_id, user_id, start_date, reason) VALUES
    ('a7000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555503', '2018-03-01', NULL),
    ('a7000000-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333331', '55555555-5555-5555-5555-555555555508', '2018-10-01', NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 15. SEED — RÉGIMES / FÉRIÉS / TÉLÉTRAVAIL
-- ============================================================
INSERT INTO work_schedule (id, name, weekly_minutes, start_time, end_time, late_tolerance_min, is_forfait_days) VALUES
    ('77777777-7777-7777-7777-777777777771', 'A — Temps plein',    2100, '09:00', '17:00', 15, FALSE),
    ('77777777-7777-7777-7777-777777777772', 'B — Temps partiel',  1440, '09:00', '15:00', 15, FALSE),
    ('77777777-7777-7777-7777-777777777773', 'C — Horaires libres',2100, NULL,    NULL,    15, FALSE),
    ('77777777-7777-7777-7777-777777777774', 'F — Forfait jours',  2100, NULL,    NULL,    15, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO work_schedule_day (work_schedule_id, iso_weekday) VALUES
    ('77777777-7777-7777-7777-777777777771',1),('77777777-7777-7777-7777-777777777771',2),('77777777-7777-7777-7777-777777777771',3),
    ('77777777-7777-7777-7777-777777777771',4),('77777777-7777-7777-7777-777777777771',5),
    ('77777777-7777-7777-7777-777777777772',1),('77777777-7777-7777-7777-777777777772',2),
    ('77777777-7777-7777-7777-777777777772',3),('77777777-7777-7777-7777-777777777772',4),
    ('77777777-7777-7777-7777-777777777773',1),('77777777-7777-7777-7777-777777777773',2),('77777777-7777-7777-7777-777777777773',3),
    ('77777777-7777-7777-7777-777777777773',4),('77777777-7777-7777-7777-777777777773',5),
    ('77777777-7777-7777-7777-777777777774',1),('77777777-7777-7777-7777-777777777774',2),('77777777-7777-7777-7777-777777777774',3),
    ('77777777-7777-7777-7777-777777777774',4),('77777777-7777-7777-7777-777777777774',5)
ON CONFLICT (work_schedule_id, iso_weekday) DO NOTHING;

INSERT INTO work_schedule_assignment (id, user_id, work_schedule_id, start_date) VALUES
    ('a4000000-0000-0000-0000-000000000002', '55555555-5555-5555-5555-555555555502', '77777777-7777-7777-7777-777777777774', '2026-01-01'),
    ('a4000000-0000-0000-0000-000000000003', '55555555-5555-5555-5555-555555555503', '77777777-7777-7777-7777-777777777774', '2026-01-01'),
    ('a4000000-0000-0000-0000-000000000004', '55555555-5555-5555-5555-555555555504', '77777777-7777-7777-7777-777777777773', '2026-01-01'),
    ('a4000000-0000-0000-0000-000000000005', '55555555-5555-5555-5555-555555555505', '77777777-7777-7777-7777-777777777771', '2026-01-01'),
    ('a4000000-0000-0000-0000-000000000006', '55555555-5555-5555-5555-555555555506', '77777777-7777-7777-7777-777777777771', '2026-01-01'),
    ('a4000000-0000-0000-0000-000000000007', '55555555-5555-5555-5555-555555555507', '77777777-7777-7777-7777-777777777771', '2026-01-01'),
    ('a4000000-0000-0000-0000-000000000008', '55555555-5555-5555-5555-555555555508', '77777777-7777-7777-7777-777777777771', '2026-01-01'),
    ('a4000000-0000-0000-0000-000000000009', '55555555-5555-5555-5555-555555555509', '77777777-7777-7777-7777-777777777772', '2026-01-01'),
    ('a4000000-0000-0000-0000-000000000010', '55555555-5555-5555-5555-555555555510', '77777777-7777-7777-7777-777777777771', '2026-01-01')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public_holiday (scope, country_code, region_code, day, label) VALUES
    ('NATIONAL','FR',NULL,'2026-01-01','Jour de l''an'),        ('NATIONAL','FR',NULL,'2026-04-06','Lundi de Pâques'),
    ('NATIONAL','FR',NULL,'2026-05-01','Fête du Travail'),      ('NATIONAL','FR',NULL,'2026-05-08','Victoire 1945'),
    ('NATIONAL','FR',NULL,'2026-05-14','Ascension'),            ('NATIONAL','FR',NULL,'2026-05-25','Lundi de Pentecôte'),
    ('NATIONAL','FR',NULL,'2026-07-14','Fête nationale'),       ('NATIONAL','FR',NULL,'2026-08-15','Assomption'),
    ('NATIONAL','FR',NULL,'2026-11-01','Toussaint'),            ('NATIONAL','FR',NULL,'2026-11-11','Armistice 1918'),
    ('NATIONAL','FR',NULL,'2026-12-25','Noël'),
    ('REGIONAL','FR','FR-ALSACE-MOSELLE','2026-04-03','Vendredi saint'),
    ('REGIONAL','FR','FR-ALSACE-MOSELLE','2026-12-26','Saint-Étienne'),
    ('ENTREPRISE','FR',NULL,'2026-05-15','Pont de l''Ascension (fermeture entreprise)')
ON CONFLICT DO NOTHING;

INSERT INTO public_holiday_exclusion (public_holiday_id, reason)
SELECT id, 'Pont travaillé' FROM public_holiday WHERE scope = 'NATIONAL' AND day = '2026-05-25'
ON CONFLICT DO NOTHING;

INSERT INTO telework_plan (id, user_id, iso_weekday, start_date, validated_by, validated_at) VALUES
    ('ab000000-0000-0000-0000-000000000001', '55555555-5555-5555-5555-555555555507', 3, '2026-01-01', '55555555-5555-5555-5555-555555555504', '2026-01-02 09:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 16. SEED — ABSENCES / POINTAGES / DÉMO
-- ============================================================
INSERT INTO absence_type (id, code, label, has_counter) VALUES
    (1, 'CP',            'Congés payés',        TRUE),
    (2, 'RTT',           'RTT',                 TRUE),
    (3, 'MALADIE',       'Maladie',             FALSE),
    (4, 'FORMATION',     'Formation',           FALSE),
    (5, 'EVENEMENT_FAM', 'Événement familial',  FALSE),
    (6, 'SANS_SOLDE',    'Congé sans solde',    FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO leave_balance (id, user_id, type_id, period, acquired_days) VALUES
    ('a9000000-0000-0000-0000-000000000001', '55555555-5555-5555-5555-555555555506', 1, '2026', 25),
    ('a9000000-0000-0000-0000-000000000002', '55555555-5555-5555-5555-555555555510', 1, '2026', 25)
ON CONFLICT (id) DO NOTHING;

INSERT INTO absence (id, user_id, type_id, start_date, end_date, reason, status) VALUES
    ('aa000000-0000-0000-0000-000000000001', '55555555-5555-5555-5555-555555555506', 1, '2026-10-12', '2026-10-14', 'Congés', 'EN_ATTENTE')
ON CONFLICT (id) DO NOTHING;

SELECT fn_generate_absence_days('aa000000-0000-0000-0000-000000000001');

INSERT INTO clock_event (id, user_id, team_id, type, work_mode, occurred_at, source, status) VALUES
    ('ac000000-0000-0000-0000-000000000001', '55555555-5555-5555-5555-555555555506', '44444444-4444-4444-4444-444444444443', 'ENTREE', 'BUREAU', '2026-10-05 08:58:00+02', 'APP', 'VALIDE'),
    ('ac000000-0000-0000-0000-000000000002', '55555555-5555-5555-5555-555555555506', '44444444-4444-4444-4444-444444444443', 'SORTIE', 'BUREAU', '2026-10-05 17:32:00+02', 'APP', 'VALIDE'),
    ('ac000000-0000-0000-0000-000000000003', '55555555-5555-5555-5555-555555555506', '44444444-4444-4444-4444-444444444443', 'ENTREE', 'BUREAU', '2026-10-06 09:12:00+02', 'APP', 'EN_ATTENTE_VALIDATION'),
    ('ac000000-0000-0000-0000-000000000004', '55555555-5555-5555-5555-555555555506', '44444444-4444-4444-4444-444444444443', 'SORTIE', 'BUREAU', '2026-10-06 17:05:00+02', 'APP', 'VALIDE'),
    ('ac000000-0000-0000-0000-000000000005', '55555555-5555-5555-5555-555555555507', '44444444-4444-4444-4444-444444444441', 'ENTREE', 'REMOTE',  '2026-10-07 09:00:00+02', 'APP', 'VALIDE'),
    ('ac000000-0000-0000-0000-000000000006', '55555555-5555-5555-5555-555555555507', '44444444-4444-4444-4444-444444444441', 'SORTIE', 'REMOTE',  '2026-10-07 17:30:00+02', 'APP', 'VALIDE')
ON CONFLICT (id) DO NOTHING;

INSERT INTO anomaly (id, user_id, anomaly_date, type, clock_event_id, status, detail) VALUES
    ('ad000000-0000-0000-0000-000000000001', '55555555-5555-5555-5555-555555555506', '2026-10-06', 'RETARD', 'ac000000-0000-0000-0000-000000000003', 'OUVERTE', 'Entrée à 09:12, au-delà de la tolérance de 15 min.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO notification (id, user_id, type, title, message, data) VALUES
    ('ae000000-0000-0000-0000-000000000001', '55555555-5555-5555-5555-555555555506', 'POINTAGE_A_VALIDER', 'Pointage en attente', 'Votre pointage du 6 octobre est en attente de validation.', '{"date":"2026-10-06"}'),
    ('ae000000-0000-0000-0000-000000000002', '55555555-5555-5555-5555-555555555504', 'POINTAGE_A_VALIDER', '1 pointage à valider', 'Léa Dubois a un pointage en attente.', '{"user":"Léa Dubois"}'),
    ('ae000000-0000-0000-0000-000000000003', '55555555-5555-5555-5555-555555555504', 'ABSENCE_A_VALIDER', '1 absence à valider', 'Léa Dubois a demandé un congé du 12 au 14 octobre.', '{"absence":"2026-10-12"}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO app_config (config_key, value, module, description) VALUES
    ('SESSION_MAX_MINUTES',   '960', 'POINTAGE', 'Durée max d''une session (min)'),
    ('CLOCK_MIN_GAP_SEC',     '60',  'POINTAGE', 'Écart minimal entre deux pointages'),
    ('CORRECTION_WINDOW_DAYS','30',  'POINTAGE', 'Délai max pour corriger un pointage'),
    ('KPI_MIN_MEMBERS',       '3',   'KPI',      'Seuil de k-anonymat des KPI de groupe'),
    ('JWT_EXPIRY_HOURS',      '12',  'AUTH',     'Durée de vie du JWT'),
    ('DEFAULT_COUNTRY',       'FR',  'GENERAL',  'Pays par défaut')
ON CONFLICT (config_key) DO NOTHING;

COMMIT;

-- ============================================================
-- FIN — Trinity Market DB v1 simple
-- ============================================================
