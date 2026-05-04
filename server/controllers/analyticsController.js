/**
 * controllers/analyticsController.js
 * Full analytics backend for the admin dashboard.
 * Endpoints: overview, courses, users, activity, ai-insights
 */

const { pool } = require('../config/db');

/* ─── helpers ──────────────────────────────────────────────── */
const int = v => parseInt(v, 10) || 0;
const flt = v => parseFloat(v) || 0;

const dateFilter = (range) => {
  const now = new Date();
  const map = {
    '7d':  new Date(now - 7  * 86400000),
    '30d': new Date(now - 30 * 86400000),
    '90d': new Date(now - 90 * 86400000),
    '1y':  new Date(now - 365* 86400000),
    'all': new Date('2000-01-01'),
  };
  return (map[range] || map['30d']).toISOString();
};

/* ══════════════════════════════════════════════════════════════
   GET /api/admin/analytics/overview
   KPIs + revenue trend + enrollment trend
   ══════════════════════════════════════════════════════════════ */
const getOverview = async (req, res) => {
  try {
    const since = dateFilter(req.query.range || '30d');

    // ── KPIs ───────────────────────────────────────────────────
    const [usersR, coursesR, enrollR, revR, prevRevR, prevEnrollR] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users WHERE role=$1', ['user']),
      pool.query('SELECT COUNT(*) FROM courses'),
      pool.query('SELECT COUNT(*) FROM enrollments WHERE created_at >= $1', [since]),
      pool.query("SELECT COALESCE(SUM(amount),0) as total FROM payments WHERE status='paid' AND created_at >= $1", [since]),
      pool.query("SELECT COALESCE(SUM(amount),0) as total FROM payments WHERE status='paid' AND created_at < $1 AND created_at >= $2", [since, dateFilter('90d')]),
      pool.query('SELECT COUNT(*) FROM enrollments WHERE created_at < $1', [since]),
    ]);

    const totalRevenue    = flt(revR.rows[0].total);
    const prevRevenue     = flt(prevRevR.rows[0].total);
    const totalEnrollments= int(enrollR.rows[0].count);
    const prevEnrollments = int(prevEnrollR.rows[0].count);

    // ── Revenue trend (daily grouping) ─────────────────────────
    const revTrendR = await pool.query(`
      SELECT TO_CHAR(DATE_TRUNC('day', created_at), 'Mon DD') as label,
             SUM(amount) as revenue, COUNT(*) as sales
      FROM payments
      WHERE status='paid' AND created_at >= $1
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY DATE_TRUNC('day', created_at)
    `, [since]);

    // ── Enrollment trend ───────────────────────────────────────
    const enrTrendR = await pool.query(`
      SELECT TO_CHAR(DATE_TRUNC('day', created_at), 'Mon DD') as label,
             COUNT(*) as enrollments
      FROM enrollments
      WHERE created_at >= $1
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY DATE_TRUNC('day', created_at)
    `, [since]);

    // ── User registration trend ────────────────────────────────
    const userTrendR = await pool.query(`
      SELECT TO_CHAR(DATE_TRUNC('day', created_at), 'Mon DD') as label,
             COUNT(*) as users
      FROM users
      WHERE created_at >= $1
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY DATE_TRUNC('day', created_at)
    `, [since]);

    // ── Revenue by course (pie/bar) ────────────────────────────
    const revByCourseR = await pool.query(`
      SELECT c.title as name,
             COALESCE(SUM(p.amount),0) as revenue,
             COUNT(p.id) as sales
      FROM courses c
      LEFT JOIN payments p ON p.course_id = c.id AND p.status='paid' AND p.created_at >= $1
      GROUP BY c.id, c.title
      ORDER BY revenue DESC
      LIMIT 8
    `, [since]);

    res.json({
      kpis: {
        totalUsers:       int(usersR.rows[0].count),
        totalCourses:     int(coursesR.rows[0].count),
        totalEnrollments,
        enrollmentChange: prevEnrollments > 0 ? Math.round(((totalEnrollments - prevEnrollments)/prevEnrollments)*100) : 0,
        totalRevenue,
        revenueChange:   prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue)/prevRevenue)*100) : 0,
      },
      revenueTrend:    revTrendR.rows.map(r => ({ label: r.label, revenue: flt(r.revenue), sales: int(r.sales) })),
      enrollmentTrend: enrTrendR.rows.map(r => ({ label: r.label, enrollments: int(r.enrollments) })),
      userTrend:       userTrendR.rows.map(r => ({ label: r.label, users: int(r.users) })),
      revenueByCourse: revByCourseR.rows.map(r => ({ name: r.name, revenue: flt(r.revenue), sales: int(r.sales) })),
    });
  } catch (err) {
    console.error('[analytics] overview error:', err);
    res.status(500).json({ error: 'Failed to load overview' });
  }
};

/* ══════════════════════════════════════════════════════════════
   GET /api/admin/analytics/courses
   Per-course: enrollments, completion %, revenue, lesson progress
   ══════════════════════════════════════════════════════════════ */
const getCourseAnalytics = async (req, res) => {
  try {
    const since = dateFilter(req.query.range || '30d');
    const courseId = req.query.courseId;

    // ── Course overview list ───────────────────────────────────
    const coursesR = await pool.query(`
      SELECT
        c.id, c.title, c.level, c.price,
        COUNT(DISTINCT e.id)                       AS total_enrollments,
        COUNT(DISTINCT p.id)                       AS total_sales,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status='paid'), 0) AS revenue,
        (SELECT COUNT(*) FROM course_modules m WHERE m.course_id = c.id)     AS module_count,
        (SELECT COUNT(*) FROM course_lessons l
         JOIN course_modules m2 ON l.module_id = m2.id
         WHERE m2.course_id = c.id)                     AS lesson_count
      FROM courses c
      LEFT JOIN enrollments e ON e.course_id = c.id AND e.created_at >= $1
      LEFT JOIN payments p    ON p.course_id = c.id AND p.created_at >= $1
      GROUP BY c.id
      ORDER BY total_enrollments DESC
    `, [since]);

    // ── Completion rates: parse completed_lessons JSON array ───
    const completionR = await pool.query(`
      SELECT e.course_id,
             COUNT(*) as enrolled,
             SUM(CASE WHEN jsonb_array_length(e.completed_lessons::jsonb) > 0 THEN 1 ELSE 0 END) as started,
             AVG(
               CASE
                 WHEN sub.lesson_count > 0
                 THEN LEAST(jsonb_array_length(e.completed_lessons::jsonb)::float / sub.lesson_count * 100, 100)
                 ELSE 0
               END
             ) as avg_completion
      FROM enrollments e
      JOIN (
        SELECT m.course_id, COUNT(l.id) as lesson_count
        FROM course_modules m
        JOIN course_lessons l ON l.module_id = m.id
        GROUP BY m.course_id
      ) sub ON sub.course_id = e.course_id
      WHERE e.completed_lessons IS NOT NULL
        AND e.completed_lessons != 'null'
        AND e.completed_lessons::text != '[]'
        AND e.completed_lessons::text ~ '^\\['
      GROUP BY e.course_id
    `);

    const completionMap = {};
    completionR.rows.forEach(r => {
      completionMap[r.course_id] = { enrolled: int(r.enrolled), started: int(r.started), avgCompletion: Math.round(flt(r.avg_completion)) };
    });

    const courses = coursesR.rows.map(c => ({
      id:              int(c.id),
      title:           c.title,
      level:           c.level,
      price:           flt(c.price),
      enrollments:     int(c.total_enrollments),
      sales:           int(c.total_sales),
      revenue:         flt(c.revenue),
      moduleCount:     int(c.module_count),
      lessonCount:     int(c.lesson_count),
      avgCompletion:   completionMap[c.id]?.avgCompletion ?? 0,
      started:         completionMap[c.id]?.started       ?? 0,
    }));

    // ── Drill-down: lesson-level completion for a specific course ──
    let lessonBreakdown = [];
    if (courseId) {
      const lessonR = await pool.query(`
        SELECT l.id, l.title, l.sort_order, m.title as module_title
        FROM course_lessons l
        JOIN course_modules m ON l.module_id = m.id
        WHERE m.course_id = $1
        ORDER BY m.sort_order, l.sort_order
      `, [courseId]);

      // Count how many learners completed each lesson
      const enrollmentsR = await pool.query(`
        SELECT completed_lessons FROM enrollments WHERE course_id=$1
          AND completed_lessons IS NOT NULL AND completed_lessons::text LIKE '[%'
      `, [courseId]);

      const lessonCounts = {};
      enrollmentsR.rows.forEach(e => {
        let cl = [];
        try { cl = JSON.parse(e.completed_lessons); } catch{}
        cl.forEach(lid => { lessonCounts[lid] = (lessonCounts[lid]||0)+1; });
      });

      const totalEnrolled = int(enrollmentsR.rows.length) || 1;
      lessonBreakdown = lessonR.rows.map(l => ({
        id:           int(l.id),
        title:        l.title,
        module:       l.module_title,
        order:        int(l.sort_order),
        completed:    lessonCounts[l.id] || 0,
        completionPct:Math.round(((lessonCounts[l.id]||0) / totalEnrolled) * 100),
      }));
    }

    res.json({ courses, lessonBreakdown });
  } catch (err) {
    console.error('[analytics] courses error:', err);
    res.status(500).json({ error: 'Failed to load course analytics' });
  }
};

/* ══════════════════════════════════════════════════════════════
   GET /api/admin/analytics/users
   User list with progress + spend
   ══════════════════════════════════════════════════════════════ */
const getUserAnalytics = async (req, res) => {
  try {
    const since  = dateFilter(req.query.range || '30d');
    const search = req.query.search ? `%${req.query.search}%` : '%';
    const page   = Math.max(1, int(req.query.page) || 1);
    const limit  = 20;
    const offset = (page - 1) * limit;

    const usersR = await pool.query(`
      SELECT
        u.id, u.name, u.email, u.created_at,
        u.country, u.country_code,
        COUNT(DISTINCT e.id)    as enrolled_courses,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status='paid'), 0) as total_spent,
        COUNT(DISTINCT p.id) FILTER (WHERE p.status='paid')       as purchases
      FROM users u
      LEFT JOIN enrollments e ON e.user_id = u.id
      LEFT JOIN payments    p ON p.user_id = u.id
      WHERE u.role='user'
        AND (u.name ILIKE $1 OR u.email ILIKE $1)
      GROUP BY u.id
      ORDER BY total_spent DESC
      LIMIT $2 OFFSET $3
    `, [search, limit, offset]);

    const countR = await pool.query(
      "SELECT COUNT(*) FROM users WHERE role='user' AND (name ILIKE $1 OR email ILIKE $1)",
      [search]
    );

    // ── New vs returning breakdown ─────────────────────────────
    const segR = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE created_at >= $1)  as new_users,
        COUNT(*) FILTER (WHERE last_active_at >= $1 AND last_active_at > created_at)  as returning_users
      FROM users WHERE role='user'
    `, [since]);

    res.json({
      users: usersR.rows.map(u => ({
        id:             int(u.id),
        name:           u.name,
        email:          u.email,
        joinedAt:       u.created_at,
        country:        u.country        || null,
        countryCode:    u.country_code   || null,
        enrolledCourses:int(u.enrolled_courses),
        totalSpent:     flt(u.total_spent),
        purchases:      int(u.purchases),
      })),
      total: int(countR.rows[0].count),
      page,
      pages: Math.ceil(int(countR.rows[0].count) / limit),
      segments: {
        newUsers:      int(segR.rows[0].new_users),
        returningUsers:int(segR.rows[0].returning_users),
      },
    });
  } catch (err) {
    console.error('[analytics] users error:', err);
    res.status(500).json({ error: 'Failed to load user analytics' });
  }
};

/* ══════════════════════════════════════════════════════════════
   GET /api/admin/analytics/activity
   Real-time activity feed (last 30 events)
   ══════════════════════════════════════════════════════════════ */
const getActivity = async (req, res) => {
  try {
    const [enrollR, payR, userR] = await Promise.all([
      pool.query(`
        SELECT 'enrollment' as type, u.name as actor, c.title as subject, e.created_at as ts
        FROM enrollments e
        JOIN users   u ON u.id = e.user_id
        JOIN courses c ON c.id = e.course_id
        ORDER BY e.created_at DESC LIMIT 15
      `),
      pool.query(`
        SELECT 'payment' as type, u.name as actor, c.title as subject, p.amount, p.created_at as ts
        FROM payments p
        JOIN users   u ON u.id = p.user_id
        JOIN courses c ON c.id = p.course_id
        WHERE p.status='paid'
        ORDER BY p.created_at DESC LIMIT 10
      `),
      pool.query(`
        SELECT 'signup' as type, name as actor, email as subject, created_at as ts
        FROM users WHERE role='user' ORDER BY created_at DESC LIMIT 10
      `),
    ]);

    const feed = [
      ...enrollR.rows.map(r => ({ type: r.type, actor: r.actor, subject: r.subject, ts: r.ts })),
      ...payR.rows.map(r    => ({ type: r.type, actor: r.actor, subject: r.subject, amount: flt(r.amount), ts: r.ts })),
      ...userR.rows.map(r   => ({ type: r.type, actor: r.actor, subject: r.subject, ts: r.ts })),
    ].sort((a, b) => new Date(b.ts) - new Date(a.ts)).slice(0, 30);

    res.json({ feed });
  } catch (err) {
    console.error('[analytics] activity error:', err);
    res.status(500).json({ error: 'Failed to load activity' });
  }
};

/* ══════════════════════════════════════════════════════════════
   GET /api/admin/analytics/ai-insights
   Rule-based AI insights derived from real data
   ══════════════════════════════════════════════════════════════ */
const getAIInsights = async (req, res) => {
  try {
    const [topDropR, lowCompR, revenueR, growthR] = await Promise.all([
      // Courses with lowest completion (potential drop-off)
      pool.query(`
        SELECT c.title,
          AVG(
            CASE WHEN sub.lesson_count > 0
              THEN LEAST(jsonb_array_length(e.completed_lessons::jsonb)::float / sub.lesson_count * 100, 100)
              ELSE 0 END
          ) as avg_pct,
          COUNT(e.id) as enrolled
        FROM enrollments e
        JOIN courses c ON c.id = e.course_id
        JOIN (
          SELECT m.course_id, COUNT(l.id) as lesson_count
          FROM course_modules m JOIN course_lessons l ON l.module_id = m.id
          GROUP BY m.course_id
        ) sub ON sub.course_id = e.course_id
        WHERE e.completed_lessons IS NOT NULL
          AND e.completed_lessons::text LIKE '[%'
        GROUP BY c.id HAVING COUNT(e.id) >= 1
        ORDER BY avg_pct ASC LIMIT 5
      `),
      // Revenue high but enrollment low → pricing opportunity
      pool.query(`
        SELECT c.title, c.price,
          COUNT(DISTINCT e.id) as enrollments,
          COALESCE(SUM(p.amount) FILTER (WHERE p.status='paid'),0) as revenue
        FROM courses c
        LEFT JOIN enrollments e ON e.course_id = c.id
        LEFT JOIN payments p    ON p.course_id = c.id
        GROUP BY c.id HAVING COUNT(DISTINCT e.id) < 5 AND c.price > 0
        ORDER BY c.price DESC LIMIT 3
      `),
      // Top revenue course
      pool.query(`
        SELECT c.title, COALESCE(SUM(p.amount),0) as revenue
        FROM courses c JOIN payments p ON p.course_id=c.id AND p.status='paid'
        GROUP BY c.id ORDER BY revenue DESC LIMIT 1
      `),
      // Enrollment growth last 7d vs prev 7d
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')  as last7,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '14 days'
                             AND created_at <  NOW() - INTERVAL '7 days')   as prev7
        FROM enrollments
      `),
    ]);

    const insights = [];

    // Drop-off insight
    topDropR.rows.forEach(r => {
      const pct = Math.round(flt(r.avg_pct));
      if (pct < 50) {
        insights.push({
          type: 'warning',
          title: `High drop-off: "${r.title}"`,
          body: `Only ${pct}% average completion across ${r.enrolled} learner(s). Consider adding checkpoints, shorter videos, or a mid-course quiz to re-engage.`,
          metric: `${pct}% completion`,
        });
      }
    });

    // Pricing opportunity
    lowCompR.rows.forEach(r => {
      insights.push({
        type: 'opportunity',
        title: `Low uptake: "${r.title}"`,
        body: `This $${flt(r.price)} course has only ${r.enrollments} enrollment(s). A limited-time discount or free preview lesson could drive conversions.`,
        metric: `${r.enrollments} enrolled`,
      });
    });

    // Revenue star
    if (revenueR.rows.length > 0) {
      insights.push({
        type: 'success',
        title: `Top revenue course: "${revenueR.rows[0].title}"`,
        body: `This course is your biggest earner at $${flt(revenueR.rows[0].revenue).toFixed(2)}. Consider using it as a upsell from free/lower-cost courses.`,
        metric: `$${flt(revenueR.rows[0].revenue).toFixed(2)} revenue`,
      });
    }

    // Growth trend
    const last7  = int(growthR.rows[0].last7);
    const prev7  = int(growthR.rows[0].prev7);
    const growth = prev7 > 0 ? Math.round(((last7 - prev7) / prev7) * 100) : 0;
    if (growth > 20) {
      insights.push({ type: 'success', title: 'Enrollment surge', body: `Enrollments are up ${growth}% this week vs last week. Consider running a promotional campaign to capitalise on the momentum.`, metric: `+${growth}% WoW` });
    } else if (growth < -20) {
      insights.push({ type: 'warning', title: 'Enrollment slowdown', body: `Enrollments dropped ${Math.abs(growth)}% this week. Check marketing channels and consider offering a flash promotion.`, metric: `${growth}% WoW` });
    } else {
      insights.push({ type: 'info', title: 'Steady enrollment pace', body: `Enrollments are tracking at a stable rate (${last7} this week). Consistent email campaigns could help accelerate growth.`, metric: `${last7} this week` });
    }

    res.json({ insights, generatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[analytics] ai-insights error:', err);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
};
/* ══════════════════════════════════════════════════════════════
   POST /api/prop-firms/:id/click  (public — no auth)
   Records a click event for a prop firm
   ══════════════════════════════════════════════════════════════ */
const trackPropFirmClick = async (req, res) => {
  try {
    const firmId    = int(req.params.id);
    const clickType = ['view','website','affiliate'].includes(req.body.type) ? req.body.type : 'view';
    const sessionId = req.body.session_id || null;
    if (!firmId) return res.status(400).json({ error: 'Invalid firm id' });

    await pool.query(
      'INSERT INTO prop_firm_clicks (firm_id, click_type, session_id) VALUES ($1,$2,$3)',
      [firmId, clickType, sessionId]
    );

    // Record unique per-user view when a logged-in user visits a firm
    if (req.user?.id) {
      await pool.query(
        'INSERT INTO user_prop_firm_views (user_id, firm_id) VALUES ($1,$2) ON CONFLICT (user_id, firm_id) DO UPDATE SET viewed_at = NOW()',
        [req.user.id, firmId]
      );
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('[analytics] trackClick error:', err);
    res.status(500).json({ error: 'Failed to track click' });
  }
};

/* ══════════════════════════════════════════════════════════════
   GET /api/admin/analytics/prop-firms
   Most clicked / in-demand prop firms
   ══════════════════════════════════════════════════════════════ */
const getPropFirmAnalytics = async (req, res) => {
  try {
    const since = dateFilter(req.query.range || '30d');

    const [topR, trendR, typeR, totalClicksR, uniqueFirmsR, totalFirmsR] = await Promise.all([
      pool.query(`
        SELECT
          pf.id, pf.name, pf.logo_url, pf.rating, pf.website, pf.featured,
          COUNT(c.id)                                               AS total_clicks,
          COUNT(c.id) FILTER (WHERE c.click_type = 'view')         AS view_clicks,
          COUNT(c.id) FILTER (WHERE c.click_type = 'website')      AS website_clicks,
          COUNT(c.id) FILTER (WHERE c.click_type = 'affiliate')    AS affiliate_clicks
        FROM prop_firms pf
        LEFT JOIN prop_firm_clicks c ON c.firm_id = pf.id AND c.created_at >= $1
        GROUP BY pf.id
        ORDER BY total_clicks DESC, pf.rating DESC NULLS LAST
        LIMIT 10
      `, [since]),
      pool.query(`
        SELECT TO_CHAR(DATE_TRUNC('day', created_at), 'Mon DD') AS label,
               COUNT(*) AS clicks
        FROM prop_firm_clicks WHERE created_at >= $1
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY DATE_TRUNC('day', created_at)
      `, [since]),
      pool.query(`
        SELECT click_type, COUNT(*) AS cnt
        FROM prop_firm_clicks WHERE created_at >= $1
        GROUP BY click_type
      `, [since]),
      pool.query('SELECT COUNT(*) FROM prop_firm_clicks WHERE created_at >= $1', [since]),
      pool.query('SELECT COUNT(DISTINCT firm_id) FROM prop_firm_clicks WHERE created_at >= $1', [since]),
      pool.query('SELECT COUNT(*) FROM prop_firms'),
    ]);

    res.json({
      kpis: {
        totalClicks:  int(totalClicksR.rows[0].count),
        uniqueFirms:  int(uniqueFirmsR.rows[0].count),
        totalFirms:   int(totalFirmsR.rows[0].count),
      },
      topFirms: topR.rows.map(f => ({
        id:              int(f.id),
        name:            f.name,
        logoUrl:         f.logo_url,
        rating:          flt(f.rating),
        website:         f.website,
        featured:        f.featured,
        totalClicks:     int(f.total_clicks),
        viewClicks:      int(f.view_clicks),
        websiteClicks:   int(f.website_clicks),
        affiliateClicks: int(f.affiliate_clicks),
      })),
      clickTrend:   trendR.rows.map(r => ({ label: r.label, clicks: int(r.clicks) })),
      typeBreakdown:typeR.rows.map(r  => ({ type: r.click_type, count: int(r.cnt) })),
    });
  } catch (err) {
    console.error('[analytics] propFirms error:', err);
    res.status(500).json({ error: 'Failed to load prop firm analytics' });
  }
};

/* ══════════════════════════════════════════════════════════════
   GET /api/admin/analytics/countries
   Top countries by user count + total distinct countries
   ══════════════════════════════════════════════════════════════ */
const getCountriesAnalytics = async (req, res) => {
  try {
    const [topR, totalR, noGeoR] = await Promise.all([
      pool.query(`
        SELECT country, country_code, COUNT(*) as user_count
        FROM users
        WHERE role='user' AND country_code IS NOT NULL
        GROUP BY country, country_code
        ORDER BY user_count DESC
        LIMIT 20
      `),
      pool.query(`SELECT COUNT(DISTINCT country_code) as cnt FROM users WHERE country_code IS NOT NULL`),
      pool.query(`SELECT COUNT(*) as cnt FROM users WHERE role='user' AND country_code IS NULL`),
    ]);

    const total = int(topR.rows.reduce((s, r) => s + int(r.user_count), 0)) || 1;
    const countries = topR.rows.map(r => ({
      country:     r.country,
      code:        r.country_code,
      count:       int(r.user_count),
      percentage:  Math.round((int(r.user_count) / total) * 100),
    }));

    res.json({
      countries,
      totalDistinct: int(totalR.rows[0].cnt),
      noGeoCount:    int(noGeoR.rows[0].cnt),
    });
  } catch (err) {
    console.error('[analytics] countries error:', err);
    res.status(500).json({ error: 'Failed to load countries' });
  }
};

module.exports = { getOverview, getCourseAnalytics, getUserAnalytics, getActivity, getAIInsights, trackPropFirmClick, getPropFirmAnalytics, getCountriesAnalytics };
