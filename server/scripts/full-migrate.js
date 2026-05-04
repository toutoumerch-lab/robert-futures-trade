/**
 * Full DB migration — runs ALL schema changes in dependency order.
 * Safe to run on a fresh DB or an existing one (uses IF NOT EXISTS / IF NOT EXISTS).
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { pool } = require('../config/db');
const bcrypt = require('bcrypt');

async function run() {
  const client = await pool.connect();
  try {
    console.log('Starting full database migration...\n');

    // ── 1. Users ─────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            SERIAL PRIMARY KEY,
        name          VARCHAR(100) NOT NULL,
        email         VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role          VARCHAR(20) DEFAULT 'user',
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS reset_password_token    VARCHAR(255),
        ADD COLUMN IF NOT EXISTS reset_password_expires  TIMESTAMP,
        ADD COLUMN IF NOT EXISTS verification_code       VARCHAR(6),
        ADD COLUMN IF NOT EXISTS verification_code_expires TIMESTAMP,
        ADD COLUMN IF NOT EXISTS is_verified             BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS country                 VARCHAR(100),
        ADD COLUMN IF NOT EXISTS country_code            CHAR(2),
        ADD COLUMN IF NOT EXISTS avatar_url              TEXT,
        ADD COLUMN IF NOT EXISTS last_seen               TIMESTAMP
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_country_code ON users(country_code)`);
    console.log('✅ users');

    // ── 2. Posts ─────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id         SERIAL PRIMARY KEY,
        title      VARCHAR(255) NOT NULL,
        content    TEXT NOT NULL,
        user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`
      ALTER TABLE posts
        ADD COLUMN IF NOT EXISTS image_url    TEXT,
        ADD COLUMN IF NOT EXISTS category     TEXT DEFAULT 'General',
        ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS read_time    TEXT DEFAULT '3 min read',
        ADD COLUMN IF NOT EXISTS excerpt      TEXT
    `);
    console.log('✅ posts');

    // ── 3. Comments ──────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id         SERIAL PRIMARY KEY,
        post_id    INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content    TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ comments');

    // ── 4. Reactions ─────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS reactions (
        id         SERIAL PRIMARY KEY,
        post_id    INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type       TEXT NOT NULL CHECK (type IN ('like','fire','insight')),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE (post_id, user_id, type)
      )
    `);
    console.log('✅ reactions');

    // ── 5. Categories ─────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id   SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL
      )
    `);
    const defaultCats = ['Futures Trading','Prop Firm Passing','Options Pricing','Forex Domination','Trading Psychology','General/Other'];
    for (const name of defaultCats) {
      await client.query('INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [name]);
    }
    console.log('✅ categories');

    // ── 6. Courses ───────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id          SERIAL PRIMARY KEY,
        title       VARCHAR(255) NOT NULL,
        description TEXT,
        price       DECIMAL(10,2) DEFAULT 0,
        image_url   VARCHAR(500),
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`
      ALTER TABLE courses
        ADD COLUMN IF NOT EXISTS level      VARCHAR(50) DEFAULT 'Beginner',
        ADD COLUMN IF NOT EXISTS duration   VARCHAR(50),
        ADD COLUMN IF NOT EXISTS category   VARCHAR(100) DEFAULT 'Trading',
        ADD COLUMN IF NOT EXISTS is_free    BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS video_url  VARCHAR(500),
        ADD COLUMN IF NOT EXISTS video_file VARCHAR(500),
        ADD COLUMN IF NOT EXISTS pdf_url    VARCHAR(500)
    `);
    console.log('✅ courses');

    // ── 7. Course Modules & Lessons ───────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS course_modules (
        id          SERIAL PRIMARY KEY,
        course_id   INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        title       VARCHAR(255) NOT NULL,
        description TEXT,
        sort_order  INTEGER DEFAULT 0,
        created_at  TIMESTAMP DEFAULT NOW()
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_modules_course_id ON course_modules(course_id)`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS course_lessons (
        id          SERIAL PRIMARY KEY,
        module_id   INTEGER NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
        title       VARCHAR(255) NOT NULL,
        description TEXT,
        video_url   VARCHAR(500),
        video_file  VARCHAR(500),
        pdf_url     VARCHAR(500),
        resources   JSONB DEFAULT '[]',
        sort_order  INTEGER DEFAULT 0,
        duration    VARCHAR(50),
        created_at  TIMESTAMP DEFAULT NOW()
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON course_lessons(module_id)`);
    console.log('✅ course_modules + course_lessons');

    // ── 8. Enrollments ───────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id        SERIAL PRIMARY KEY,
        user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, course_id)
      )
    `);
    console.log('✅ enrollments');

    // ── 9. Lesson Reviews ────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS lesson_reviews (
        id         SERIAL PRIMARY KEY,
        user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        lesson_id  INTEGER NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
        course_id  INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        rating     SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
        comment    TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE (user_id, lesson_id)
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_lesson_reviews_lesson ON lesson_reviews(lesson_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_lesson_reviews_course ON lesson_reviews(course_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_lesson_reviews_user   ON lesson_reviews(user_id)`);
    console.log('✅ lesson_reviews');

    // ── 10. Settings ─────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key   VARCHAR(50) PRIMARY KEY,
        value TEXT
      )
    `);
    const defaultSettings = [
      ["site_name","Robert's Trades"],["logo_url",""],["favicon_url",""],
      ["hero_title","Master Futures Trading"],["hero_subtitle",""],
      ["primary_color","#6366f1"],["ticker_speed","30"],
      ["promotion_banner_enabled","false"],["promotion_banner_text",""],
    ];
    for (const [k,v] of defaultSettings) {
      await client.query('INSERT INTO settings (key,value) VALUES ($1,$2) ON CONFLICT (key) DO NOTHING', [k,v]);
    }
    console.log('✅ settings');

    // ── 11. Promotions ───────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS promotions (
        id         SERIAL PRIMARY KEY,
        title      VARCHAR(255) NOT NULL,
        code       VARCHAR(100) NOT NULL UNIQUE,
        status     VARCHAR(20) DEFAULT 'inactive' CHECK (status IN ('active','inactive')),
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ promotions');

    // ── 12. Prop Firms ───────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS prop_firms (
        id                   SERIAL PRIMARY KEY,
        name                 TEXT,
        importance           TEXT,
        featured             BOOLEAN DEFAULT false,
        rating               FLOAT,
        website              TEXT,
        affiliate_link       TEXT,
        twitter              TEXT,
        discord              TEXT,
        last_checked         DATE,
        promo_frequency      TEXT,
        is_affiliate         BOOLEAN DEFAULT false,
        discount_code        TEXT,
        overall_score        FLOAT,
        account_category     TEXT,
        price                INTEGER,
        evaluation_fee       INTEGER,
        activation_fee       INTEGER,
        profit_split         TEXT,
        max_withdrawal       INTEGER,
        profit_target        INTEGER,
        drawdown_limit       INTEGER,
        days_to_pass         INTEGER,
        days_to_payout       INTEGER,
        notes                TEXT,
        buffer               BOOLEAN DEFAULT false,
        buffer_amount        TEXT DEFAULT NULL,
        eval                 TEXT,
        pa                   TEXT,
        reset_fee            TEXT,
        copy_trade           BOOLEAN DEFAULT false,
        vpn                  BOOLEAN DEFAULT false,
        fifty_k_all_in       INTEGER,
        fifty_k_initial_cost INTEGER,
        without_discount_usd INTEGER,
        discount_usd         INTEGER,
        discount_percent     INTEGER,
        dca                  BOOLEAN DEFAULT false,
        news                 BOOLEAN DEFAULT false,
        bots                 BOOLEAN DEFAULT false,
        micro_scalping       BOOLEAN DEFAULT false,
        max_accounts         INTEGER,
        dll                  INTEGER,
        status_color         VARCHAR(10) DEFAULT 'green' CHECK (status_color IN ('green','blue','yellow','red')),
        logo_url             TEXT,
        group_name           TEXT,
        created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ prop_firms');

    // ── 13. Platforms ─────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS platforms (
        id   SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS prop_firm_platforms (
        prop_firm_id INTEGER REFERENCES prop_firms(id) ON DELETE CASCADE,
        platform_id  INTEGER REFERENCES platforms(id) ON DELETE CASCADE,
        PRIMARY KEY (prop_firm_id, platform_id)
      )
    `);
    console.log('✅ platforms + prop_firm_platforms');

    // ── 14. Prop Firm Plans ───────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS prop_firm_plans (
        id                   SERIAL PRIMARY KEY,
        firm_id              INTEGER NOT NULL REFERENCES prop_firms(id) ON DELETE CASCADE,
        plan_name            TEXT NOT NULL,
        activation_fee       INTEGER,
        profit_split         TEXT,
        profit_target        TEXT,
        drawdown_limit       TEXT,
        dll                  TEXT,
        days_to_pass         TEXT,
        days_to_payout       TEXT,
        max_withdrawal       TEXT,
        max_accounts         TEXT,
        eval                 TEXT,
        pa                   TEXT,
        reset_fee            TEXT,
        fifty_k_all_in       INTEGER,
        fifty_k_initial_cost INTEGER,
        without_discount_usd INTEGER,
        discount_usd         INTEGER,
        discount_percent     INTEGER,
        buffer               BOOLEAN DEFAULT FALSE,
        buffer_amount        TEXT,
        copy_trade           BOOLEAN DEFAULT FALSE,
        vpn                  BOOLEAN DEFAULT FALSE,
        dca                  BOOLEAN DEFAULT FALSE,
        news                 BOOLEAN DEFAULT FALSE,
        bots                 BOOLEAN DEFAULT FALSE,
        micro_scalping       BOOLEAN DEFAULT FALSE,
        notes                TEXT,
        created_at           TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ prop_firm_plans');

    // ── 15. Prop Firm Groups ──────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS prop_firm_groups (
        name       TEXT PRIMARY KEY,
        image_url  TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ prop_firm_groups');

    // ── 16. Prop Firm Clicks ──────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS prop_firm_clicks (
        id         SERIAL PRIMARY KEY,
        firm_id    INTEGER NOT NULL REFERENCES prop_firms(id) ON DELETE CASCADE,
        click_type VARCHAR(20) NOT NULL DEFAULT 'view',
        session_id VARCHAR(64),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_pfc_firm    ON prop_firm_clicks(firm_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_pfc_created ON prop_firm_clicks(created_at)`);
    console.log('✅ prop_firm_clicks');

    // ── 17. User Prop Firm Views ──────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_prop_firm_views (
        id        SERIAL PRIMARY KEY,
        user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        firm_id   INTEGER NOT NULL REFERENCES prop_firms(id) ON DELETE CASCADE,
        viewed_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, firm_id)
      )
    `);
    console.log('✅ user_prop_firm_views');

    // ── 18. Admin user ────────────────────────────────────────────────────────
    const adminEmail    = process.env.ADMIN_EMAIL    || 'admin@roberttrades.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@1234!';
    const hash = await bcrypt.hash(adminPassword, 10);
    await client.query(`
      INSERT INTO users (name, email, password_hash, role, is_verified)
      VALUES ('Admin', $1, $2, 'admin', true)
      ON CONFLICT (email) DO UPDATE SET role = 'admin', is_verified = true
    `, [adminEmail, hash]);
    console.log(`✅ admin user: ${adminEmail}`);

    console.log('\n🎉 All migrations complete!');
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(() => process.exit(1));
