const { pool } = require('../config/db');

// Simulated Stripe Checkout Session Creation
const createCheckoutSession = async (req, res) => {
  const userId = req.user.id;
  const { courseId } = req.body;

  if (!courseId) return res.status(400).json({ error: 'courseId is required' });

  try {
    const courseResult = await pool.query('SELECT * FROM courses WHERE id = $1', [courseId]);
    if (courseResult.rows.length === 0) return res.status(404).json({ error: 'Course not found' });
    
    const course = courseResult.rows[0];

    // If the course is free, we could just enroll them instantly.
    // However, let's keep it uniform for this flow, or manually bypass:
    if (course.is_free || parseFloat(course.price) <= 0) {
       // Free bypass logic (handled by normal enrollments usually, but good to catch)
       return res.json({ freeBypass: true });
    }

    // SIMULATE STRIPE SESSION
    // In production:
    // const session = await stripe.checkout.sessions.create({
    //   line_items: [{ price_data: { currency: 'usd', product_data: { name: course.title }, unit_amount: Math.round(course.price * 100) }, quantity: 1 }],
    //   mode: 'payment',
    //   success_url: `http://localhost:5173/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    //   cancel_url: `http://localhost:5173/course/${courseId}`
    // });
    
    const simulatedSessionId = Buffer.from(`mock_session_${userId}_${courseId}_${Date.now()}`).toString('base64');
    
    // Simply redirect frontend directly to the "Success" state bypassing real Stripe interface
    res.json({ url: `http://localhost:5173/payment/success?session_id=${simulatedSessionId}` });

  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Server error creating checkout session.' });
  }
};

// Simulated Stripe Webhook/Verification
const verifySession = async (req, res) => {
  const { session_id } = req.query;

  if (!session_id) return res.status(400).json({ error: 'Missing session_id' });

  try {
    // In production, you would fetch the session from Stripe using session_id
    // const session = await stripe.checkout.sessions.retrieve(session_id);
    // const { userId, courseId } = session.metadata;
    // if (session.payment_status !== 'paid') return res.status(400);

    // Mock parsing
    const decoded = Buffer.from(session_id, 'base64').toString('ascii');
    if (!decoded.startsWith('mock_session_')) {
      return res.status(400).json({ error: 'Invalid mock session identifier.' });
    }

    const parts = decoded.split('_');
    const uId = parseInt(parts[2]);
    const cId = parseInt(parts[3]);

    if (isNaN(uId) || isNaN(cId)) return res.status(400).json({ error: 'Corrupt mock session format.' });

    // Fetch course price securely
    const courseRes = await pool.query('SELECT price FROM courses WHERE id = $1', [cId]);
    if (courseRes.rows.length === 0) return res.status(404).json({ error: 'Course not found' });
    const amount = Number(courseRes.rows[0].price);

    // Enroll user if not already enrolled
    const existing = await pool.query(
      'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [uId, cId]
    );

    if (existing.rows.length === 0) {
      await pool.query(
        'INSERT INTO enrollments (user_id, course_id) VALUES ($1, $2)',
        [uId, cId]
      );
      
      // Log official transaction revenue
      await pool.query(
        'INSERT INTO payments (user_id, course_id, amount, status) VALUES ($1, $2, $3, $4)',
        [uId, cId, amount, 'paid']
      );
    }

    res.json({ success: true, courseId: cId });
  } catch (error) {
    console.error('Verify checkout error:', error);
    res.status(500).json({ error: 'Failed to verify session' });
  }
};

module.exports = { createCheckoutSession, verifySession };
