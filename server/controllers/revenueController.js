const { pool } = require('../config/db');

const getRevenueAdmin = async (req, res) => {
  try {
    // Total Revenue (all paid amounts)
    const revenueRes = await pool.query(`SELECT SUM(amount) as total FROM payments WHERE status = 'paid'`);
    const totalRevenue = revenueRes.rows[0].total ? parseFloat(revenueRes.rows[0].total) : 0;

    // Total Sales
    const salesRes = await pool.query(`SELECT COUNT(*) as count FROM payments WHERE status = 'paid'`);
    const totalSales = parseInt(salesRes.rows[0].count, 10);

    // Active Users (count distinct users who bought something)
    const usersRes = await pool.query(`SELECT COUNT(DISTINCT user_id) as count FROM payments WHERE status = 'paid'`);
    const activeUsers = parseInt(usersRes.rows[0].count, 10);

    const averageOrderValue = totalSales > 0 ? (totalRevenue / totalSales).toFixed(2) : 0;

    // Recent Sales
    const recentSalesRes = await pool.query(`
      SELECT p.id, p.amount, p.created_at, u.name as user_name, u.email as user_email, c.title as course_title 
      FROM payments p 
      JOIN users u ON p.user_id = u.id 
      JOIN courses c ON p.course_id = c.id 
      WHERE p.status = 'paid' 
      ORDER BY p.created_at DESC 
      LIMIT 5
    `);

    // Revenue by Course (Bar Chart Data)
    const revenueByCourseRes = await pool.query(`
      SELECT c.title as name, SUM(p.amount) as revenue, COUNT(p.id) as sales 
      FROM payments p 
      JOIN courses c ON p.course_id = c.id 
      WHERE p.status = 'paid' 
      GROUP BY c.id 
      ORDER BY revenue DESC
    `);
    
    const revenueByCourse = revenueByCourseRes.rows.map(row => ({
      name: row.name,
      revenue: parseFloat(row.revenue),
      sales: parseInt(row.sales, 10)
    }));

    // Revenue Over Time (Line Chart - Grouping by Date)
    const revenueByDateRes = await pool.query(`
      SELECT DATE(created_at) as date, SUM(amount) as revenue 
      FROM payments 
      WHERE status = 'paid' 
      GROUP BY DATE(created_at) 
      ORDER BY date ASC
    `);

    // Format dates cleanly
    const revenueByDate = revenueByDateRes.rows.map(row => {
       const rawDate = new Date(row.date);
       return {
         name: rawDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
         revenue: parseFloat(row.revenue)
       };
    });

    res.json({
      totalRevenue,
      totalSales,
      averageOrderValue,
      activeUsers,
      recentSales: recentSalesRes.rows,
      revenueByCourse,
      revenueByDate
    });

  } catch (error) {
    console.error('Error fetching revenue stats:', error);
    res.status(500).json({ error: 'Server error fetching revenue data' });
  }
};

module.exports = { getRevenueAdmin };
