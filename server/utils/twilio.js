const twilio = require('twilio');

// Lazy-init so a missing config warns instead of crashing the server
let _client = null;
const getClient = () => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.error('[Twilio] TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN not set');
    return null;
  }
  if (!_client) {
    _client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    console.log('[Twilio] Client ready');
  }
  return _client;
};

const getSid = () => {
  const sid = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!sid) console.error('[Twilio] TWILIO_VERIFY_SERVICE_SID not set');
  return sid;
};

/**
 * Send an SMS OTP via Twilio Verify.
 * @param {string} phone  E.164 format e.g. +12125551234
 * @returns {{ success: boolean, status?: string, error?: string }}
 */
const sendPhoneOtp = async (phone) => {
  const client = getClient();
  const sid    = getSid();
  console.log(`[Twilio] sendPhoneOtp → phone="${phone}" sid="${sid}"`);
  if (!client || !sid) return { success: false, error: 'Twilio not configured' };
  try {
    const result = await client.verify.v2
      .services(sid)
      .verifications.create({ to: phone, channel: 'sms' });
    console.log(`[Twilio] SMS OTP sent to ${phone} — status: ${result.status}, sid: ${result.sid}`);
    return { success: true, status: result.status };
  } catch (err) {
    console.error(`[Twilio] sendPhoneOtp FAILED for ${phone}:`, err.status, err.code, err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Verify a Twilio OTP code for a phone number.
 * @param {string} phone  E.164 format
 * @param {string} code   6-digit code
 * @returns {{ success: boolean, valid: boolean, error?: string }}
 */
const verifyPhoneOtp = async (phone, code) => {
  const client = getClient();
  const sid    = getSid();
  if (!client || !sid) return { success: false, valid: false, error: 'Twilio not configured' };
  try {
    const check = await client.verify.v2
      .services(sid)
      .verificationChecks.create({ to: phone, code });
    console.log(`[Twilio] Verify check for ${phone} — status: ${check.status}`);
    return { success: true, valid: check.status === 'approved' };
  } catch (err) {
    console.error(`[Twilio] verifyPhoneOtp error for ${phone}:`, err.message);
    return { success: false, valid: false, error: err.message };
  }
};

module.exports = { sendPhoneOtp, verifyPhoneOtp };
