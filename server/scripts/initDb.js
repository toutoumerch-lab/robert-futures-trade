const { pool } = require('../config/db');

const initDb = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Posts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Comments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Reactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reactions (
        id SERIAL PRIMARY KEY,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        UNIQUE(post_id, user_id, type)
      );
    `);

    // Courses table
    await client.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Prop Firms table
    await client.query(`
      CREATE TABLE IF NOT EXISTS prop_firms (
        id SERIAL PRIMARY KEY,
        name TEXT,
        importance TEXT,
        featured BOOLEAN DEFAULT false,
        rating FLOAT,
        website TEXT,
        affiliate_link TEXT,
        twitter TEXT,
        discord TEXT,
        last_checked DATE,
        promo_frequency TEXT,
        is_affiliate BOOLEAN DEFAULT false,
        discount_code TEXT,
        overall_score FLOAT,
        account_category TEXT,
        price INTEGER,
        evaluation_fee INTEGER,
        activation_fee INTEGER,
        profit_split TEXT,
        max_withdrawal INTEGER,
        profit_target INTEGER,
        drawdown_limit INTEGER,
        days_to_pass INTEGER,
        days_to_payout INTEGER,
        notes TEXT,
        buffer BOOLEAN DEFAULT false,
        buffer_amount TEXT DEFAULT NULL,
        eval TEXT,
        pa TEXT,
        reset_fee TEXT,
        copy_trade BOOLEAN DEFAULT false,
        vpn BOOLEAN DEFAULT false,
        fifty_k_all_in INTEGER,
        fifty_k_initial_cost INTEGER,
        without_discount_usd INTEGER,
        discount_usd INTEGER,
        discount_percent INTEGER,
        dca BOOLEAN DEFAULT false,
        news BOOLEAN DEFAULT false,
        bots BOOLEAN DEFAULT false,
        micro_scalping BOOLEAN DEFAULT false,
        max_accounts INTEGER,
        dll INTEGER,
        status_color VARCHAR(10) DEFAULT 'green' CHECK (status_color IN ('green', 'blue', 'yellow', 'red')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Platforms tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS platforms (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS prop_firm_platforms (
        prop_firm_id INTEGER REFERENCES prop_firms(id) ON DELETE CASCADE,
        platform_id INTEGER REFERENCES platforms(id) ON DELETE CASCADE,
        PRIMARY KEY (prop_firm_id, platform_id)
      );
    `);

    await client.query('COMMIT');
    console.log('Database schema created successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error initializing database:', error);
  } finally {
    client.release();
    process.exit(0);
  }
};

initDb();
