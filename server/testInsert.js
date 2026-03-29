require('dotenv').config({ path: './.env' });
const { pool } = require('./config/db');

const test = async () => {
  const reqBody = {
    name: 'Test Firm',
    status_color: 'green'
  };

  const { 
    name, importance, featured, rating, website, affiliate_link, twitter, discord, 
    last_checked, is_affiliate, discount_code, overall_score, 
    account_category, price, activation_fee, profit_split, 
    max_withdrawal, profit_target, drawdown_limit, days_to_pass, days_to_payout, notes,
    buffer, eval: eval_type, pa, reset_fee, copy_trade, vpn, max_accounts, dll,
    fifty_k_all_in, fifty_k_initial_cost, without_discount_usd, discount_usd, discount_percent,
    dca, news, bots, micro_scalping,
    status_color, platforms
  } = reqBody;

  const num = (v) => (v === '' || v === undefined || v === 'undefined' || v === null) ? null : v;

  try {
      const result = await pool.query(
        `INSERT INTO prop_firms (
          name, importance, featured, rating, website, affiliate_link, twitter, discord, 
          last_checked, is_affiliate, discount_code, overall_score, 
          account_category, price, activation_fee, profit_split, 
          max_withdrawal, profit_target, drawdown_limit, days_to_pass, days_to_payout, notes, 
          buffer, eval, pa, reset_fee, copy_trade, vpn, max_accounts, dll, 
          fifty_k_all_in, fifty_k_initial_cost, without_discount_usd, discount_usd, discount_percent,
          dca, news, bots, micro_scalping,
          status_color
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 
          $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, 
          $31, $32, $33, $34, $35, $36, $37, $38, $39, $40
        ) RETURNING *`,
        [
          name, num(importance), featured || false, num(rating), num(website), num(affiliate_link), num(twitter), num(discord), 
          num(last_checked), is_affiliate || false, num(discount_code), num(overall_score), 
          num(account_category), num(price), num(activation_fee), num(profit_split), 
          num(max_withdrawal), num(profit_target), num(drawdown_limit), num(days_to_pass), num(days_to_payout), num(notes),
          buffer || false, num(eval_type), num(pa), num(reset_fee), copy_trade || false, vpn || false,
          num(max_accounts), num(dll), 
          num(fifty_k_all_in), num(fifty_k_initial_cost), num(without_discount_usd), num(discount_usd), num(discount_percent),
          dca || false, news || false, bots || false, micro_scalping || false, 
          status_color || 'green'
        ]
      );
      console.log('Success:', result.rows);
  } catch(e) {
      console.error('Error:', e.message);
  } finally {
      process.exit(0);
  }
};
test();
