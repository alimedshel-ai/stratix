-- ============================================================
-- migration-dept-tools.sql
-- جداول أدوات منهجية الإدارات الـ 15
-- متوافقة مع قاعدة بيانات Prisma / PostgreSQL
-- ============================================================

-- ── 1. تحليل PESTEL ──
CREATE TABLE IF NOT EXISTS pestel (
    dept        VARCHAR(50)  PRIMARY KEY,
    data        JSONB        NOT NULL DEFAULT '{}',
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE pestel IS 'تخزين بيانات تحليل PESTEL لكل إدارة';

-- ── 2. تحليل SWOT ──
CREATE TABLE IF NOT EXISTS swot (
    dept        VARCHAR(50)  PRIMARY KEY,
    data        JSONB        NOT NULL DEFAULT '{}',
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE swot IS 'تخزين بيانات تحليل SWOT لكل إدارة';

-- ── 3. خريطة المخاطر ──
CREATE TABLE IF NOT EXISTS risk_map (
    dept        VARCHAR(50)  PRIMARY KEY,
    data        JSONB        NOT NULL DEFAULT '[]',
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE risk_map IS 'خريطة المخاطر وتقييماتها لكل إدارة';

-- ── 4. صحة الإدارة ──
CREATE TABLE IF NOT EXISTS dept_health (
    dept        VARCHAR(50)  PRIMARY KEY,
    data        JSONB        NOT NULL DEFAULT '{}',
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE dept_health IS 'مؤشرات صحة الإدارة ونتائج الفحص الدوري';

-- ── 5. السيناريوهات الاستراتيجية ──
CREATE TABLE IF NOT EXISTS scenarios (
    dept        VARCHAR(50)  PRIMARY KEY,
    data        JSONB        NOT NULL DEFAULT '[]',
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE scenarios IS 'السيناريوهات الاستراتيجية لكل إدارة (متفائل، متشائم، معتدل)';

-- ── 6. OKRs (الأهداف والنتائج الرئيسية) ──
CREATE TABLE IF NOT EXISTS dept_okrs (
    dept        VARCHAR(50)  PRIMARY KEY,
    data        JSONB        NOT NULL DEFAULT '[]',
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE dept_okrs IS 'أهداف OKRs وكل نتائجها الرئيسية لكل إدارة';

-- ── 7. مؤشرات الأداء KPIs (بمستوى الإدارة) ──
CREATE TABLE IF NOT EXISTS dept_kpis (
    dept        VARCHAR(50)  PRIMARY KEY,
    data        JSONB        NOT NULL DEFAULT '[]',
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE dept_kpis IS 'مؤشرات الأداء الخاصة بكل إدارة';

-- ── 8. تتبع الإنجاز (Progress) ──
CREATE TABLE IF NOT EXISTS dept_progress (
    dept        VARCHAR(50)  NOT NULL,
    step_id     VARCHAR(50)  NOT NULL,
    completed   BOOLEAN      NOT NULL DEFAULT FALSE,
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    PRIMARY KEY (dept, step_id)
);
COMMENT ON TABLE dept_progress IS 'تتبع إنجاز خطوات الرحلة الاستراتيجية لكل إدارة';

-- ── فهارس للأداء ──
CREATE INDEX IF NOT EXISTS idx_dept_progress_dept    ON dept_progress (dept);
CREATE INDEX IF NOT EXISTS idx_dept_progress_step    ON dept_progress (step_id);
CREATE INDEX IF NOT EXISTS idx_dept_progress_updated ON dept_progress (updated_at DESC);

-- ── دالة تحديث updated_at تلقائياً ──
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ربط الـ trigger بكل جدول
DO $$ DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['pestel','swot','risk_map','dept_health','scenarios','dept_okrs','dept_kpis']
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS trg_%s_updated_at ON %I;
            CREATE TRIGGER trg_%s_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        ', t, t, t, t);
    END LOOP;
END $$;
