require('dotenv').config({ path: __dirname + '/../.env' });
const { pool } = require('../config/db');

// Helpers for random data
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min, max) => (Math.random() * (max - min) + min).toFixed(2);
const randDate = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - randInt(0, daysAgo));
  d.setHours(randInt(0, 23), randInt(0, 59), randInt(0, 59));
  return d.toISOString();
};
const randArr = (arr) => arr[Math.floor(Math.random() * arr.length)];

const countries = [
  { code: 'US', name: 'United States' }, { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' }, { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' }, { code: 'FR', name: 'France' }
];

async function seed() {
  try {
    console.log('Seeding realistic analytics data...');

    // 1. Check/create courses
    const coursesRes = await pool.query('SELECT id FROM courses');
    let courseIds = coursesRes.rows.map(r => r.id);
    
    if (courseIds.length === 0) {
      console.log('Creating mock courses...');
      const coursesToInsert = [
        { title: 'Futures Trading Mastery', price: 499, level: 'Beginner' },
        { title: 'Prop Firm Challenge Blueprint', price: 299, level: 'Intermediate' },
        { title: 'Advanced Volume Profile', price: 599, level: 'Advanced' }
      ];
      for (const c of coursesToInsert) {
        const res = await pool.query(
          `INSERT INTO courses (title, description, price, level, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [c.title, 'Course description here', c.price, c.level, randDate(90)]
        );
        courseIds.push(res.rows[0].id);
        
        // Add modules and lessons for this course
        const modRes = await pool.query(
          `INSERT INTO course_modules (course_id, title, sort_order) VALUES ($1, $2, $3) RETURNING id`,
          [res.rows[0].id, 'Introduction', 1]
        );
        const modId = modRes.rows[0].id;
        for (let i = 1; i <= 5; i++) {
          await pool.query(
            `INSERT INTO course_lessons (module_id, title, sort_order) VALUES ($1, $2, $3)`,
            [modId, `Lesson ${i}`, i]
          );
        }
      }
    }

    // Load lessons per course
    const lessonsPerCourse = {};
    for (const cid of courseIds) {
      const lr = await pool.query(
        `SELECT l.id FROM course_lessons l JOIN course_modules m ON m.id = l.module_id WHERE m.course_id = $1`, [cid]
      );
      lessonsPerCourse[cid] = lr.rows.map(r => r.id);
    }

    // 2. Create users (approx 50)
    console.log('Creating mock users...');
    const userIds = [];
    for (let i = 1; i <= 50; i++) {
      const c = randArr(countries);
      const joinedAt = randDate(90);
      const activeAt = randDate(5); // Recently active
      const res = await pool.query(
        `INSERT INTO users (name, email, password_hash, role, country, country_code, created_at, last_active_at) 
         VALUES ($1, $2, 'hash', 'user', $3, $4, $5, $6) ON CONFLICT (email) DO NOTHING RETURNING id`,
        [`User ${i}`, `user${i}_${Date.now()}@example.com`, c.name, c.code, joinedAt, activeAt]
      );
      if (res.rows.length > 0) {
        userIds.push(res.rows[0].id);
      }
    }

    // 3. Create enrollments & payments
    console.log('Creating enrollments and payments...');
    for (const uid of userIds) {
      // 1 to 3 courses per user
      const numCourses = randInt(1, 3);
      const shuffledCourses = [...courseIds].sort(() => 0.5 - Math.random());
      const selectedCourses = shuffledCourses.slice(0, numCourses);

      for (const cid of selectedCourses) {
        // Fetch course price
        const priceRes = await pool.query('SELECT price FROM courses WHERE id = $1', [cid]);
        const price = priceRes.rows[0].price;

        const enrolledAt = randDate(60);

        // Calculate completed lessons (random amount)
        const lessons = lessonsPerCourse[cid] || [];
        const numCompleted = randInt(0, lessons.length);
        const completed = lessons.slice(0, numCompleted);

        // Insert Enrollment
        await pool.query(
          `INSERT INTO enrollments (user_id, course_id, created_at, completed_lessons) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
          [uid, cid, enrolledAt, JSON.stringify(completed)]
        );

        // Insert Payment
        await pool.query(
          `INSERT INTO payments (user_id, course_id, amount, status, created_at) VALUES ($1, $2, $3, 'paid', $4)`,
          [uid, cid, price, enrolledAt]
        );
      }
    }

    // 4. Create Prop Firm Clicks
    console.log('Creating prop firm clicks...');
    const pfRes = await pool.query('SELECT id FROM prop_firms LIMIT 10');
    let pfIds = pfRes.rows.map(r => r.id);
    
    if (pfIds.length === 0) {
       // Insert a couple mock firms if none exist
       for(let i=1; i<=3; i++) {
         const r = await pool.query(`INSERT INTO prop_firms (name, rating) VALUES ($1, 4.5) RETURNING id`, [`Mock Firm ${i}`]);
         pfIds.push(r.rows[0].id);
       }
    }

    const clickTypes = ['view', 'website', 'affiliate'];
    for (let i = 0; i < 200; i++) {
      const type = randArr(clickTypes);
      const pfId = randArr(pfIds);
      const clickedAt = randDate(30);
      await pool.query(
        `INSERT INTO prop_firm_clicks (firm_id, click_type, created_at) VALUES ($1, $2, $3)`,
        [pfId, type, clickedAt]
      );
    }

    console.log('✅ Seed complete!');
    process.exit(0);
  } catch (e) {
    console.error('Seeding failed:', e.message);
    process.exit(1);
  }
}

seed();
