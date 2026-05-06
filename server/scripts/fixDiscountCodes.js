require('dotenv').config({ path: '../.env' });
const { pool } = require('../config/db');

const updates = [
  // Lucid
  { name: 'Lucid Flex',                                    code: 'RTF' },
  { name: 'Lucid Pro',                                     code: 'RTF' },
  { name: 'Lucid Direct',                                  code: 'RTF' },
  // YRM Prop
  { name: 'YRM Prop - Starter Challenge (50K)',            code: 'RTF' },
  { name: 'YRM Prop - Starter Challenge (25K)',            code: 'RTF' },
  { name: 'YRM Prop Instant Prime (50K)',                  code: 'RTF' },
  { name: 'YRM Prop Instant Prime (25K)',                  code: 'RTF' },
  // Purdia
  { name: 'Purdia Eval (EOD)',                             code: 'RTF' },
  { name: 'Purdia Instant Funded',                         code: null  },
  // Funded Futures Network
  { name: 'Funded Futures Network Standard',               code: 'RTF' },
  { name: 'Funded Futures Network Express',                code: 'RTF' },
  { name: 'Funded Futures Network Express MAX',            code: 'RTF' },
  { name: 'Funded Futures Network Standard MAX',           code: 'RTF' },
  // Bulenox
  { name: 'Bulenox Option 1',                             code: 'RTF89' },
  { name: 'Bulenox Option 2',                             code: 'RTF75' },
  // Tradeify
  { name: 'Tradeify - Growth',                            code: '3879' },
  { name: 'Tradeify - Select',                            code: '3879' },
  { name: 'Tradeify - Lightning',                         code: '3879' },
  // TradeDay
  { name: 'TradeDay Intraday',                            code: 'RTF' },
  { name: 'TradeDay Static',                              code: 'RTF' },
  { name: 'TradeDay (End of Day)',                        code: 'RTF' },
  // FundedFuturesFamily
  { name: 'FundedFuturesFamily (Prime)',                  code: 'RTF' },
  { name: 'FundedFuturesFamily (Premier)',                code: 'RTF' },
  { name: 'FundedFuturesFamily (Velocity)',               code: 'RTF' },
  { name: 'FundedFuturesFamily (S2F)',                    code: null  },
  // E8
  { name: 'E8 Signature',                                code: 'E8RTF' },
  // Humble Futures
  { name: 'Humble Futures (Standard Path)',              code: 'RTF' },
  { name: 'Humble Futures (Express Path)',               code: 'RTF' },
  { name: 'Humble Futures (25k Instant)',                code: 'RTF' },
  // BluSky
  { name: 'BluSky Premium',                             code: '30OFF' },
  { name: 'BluSky Static (150k)',                       code: '30OFF' },
  { name: 'BluSky Launch',                              code: null   },
  { name: 'BluSky Instant',                             code: null   },
  // E2T
  { name: 'E2T The Career Path',                        code: 'RTF' },
  { name: 'E2T The Guantlet Mini',                      code: 'RTF' },
  // Savius
  { name: 'Savius Viper (50k)',                         code: 'RTF' },
  { name: 'Savius Typhoon (100k)',                      code: 'RTF' },
  { name: 'Savius Raptor (25k)',                        code: 'RTF' },
  { name: 'Savius Thunderbolt',                         code: 'RTF' },
  // FundedNext
  { name: 'FundedNext - Rapid ($50k)',                  code: null  },
  { name: 'FundedNext - Legacy ($50k)',                 code: null  },
  // Alpha Futures
  { name: 'Alpha Futures - Zero',                       code: null      },
  { name: 'Alpha Futures - Premium',                    code: 'PREMIUM' },
  { name: 'Alpha Futures - Advanced',                   code: null      },
  // Phidias
  { name: 'Phidias 25k Static',                        code: 'RTF' },
  { name: 'Phidias 50k (All OTP)',                     code: 'RTF' },
  { name: 'Phidias 50k Standard',                      code: 'RTF' },
  { name: 'Phidias 50k SWING',                         code: 'RTF' },
  // BlueBerry
  { name: 'BlueBerry Futures Ascent',                  code: 'FUTURES60' },
  { name: 'BlueBerry Futures Accelerated',             code: 'FUTURES60' },
  // Blue Guardian
  { name: 'Blue Guardian Futures Standard Evaluation', code: 'RTF' },
  { name: 'Blue Guardian Futures Guardian Evaluation', code: 'RTF' },
  { name: 'Blue Guardian Futures Instant Guardian',    code: 'RTF' },
  // Elite Trader Funding
  { name: 'Elite Trader Funding 1 Step',               code: 'APRIL80' },
  { name: 'Elite Trader Funding Direct to Funded',     code: null      },
  { name: 'Elite Trader Funding Static',               code: 'APRIL80' },
  { name: 'Elite Trader Funding End of Day',           code: 'APRIL80' },
  // AquaFutures
  { name: 'AquaFutures - Beginner',                   code: 'EASTER' },
  { name: 'AquaFutures - Standard',                   code: 'EASTER' },
  { name: 'AquaFutures - Instant',                    code: 'EASTER' },
  { name: 'AquaFutures - Instant Pro',                code: 'EASTER' },
  // FuturesElite
  { name: 'FuturesElite - Prime',                     code: 'Use Link For Best Discount' },
  { name: 'FuturesElite - Elite',                     code: 'Use Link For Best Discount' },
  { name: 'FuturesElite - Instant',                   code: 'Use Link For Best Discount' },
  // GOAT
  { name: 'GOAT Funded Futures - EOD',                code: 'Use Link For Best Discount' },
  { name: 'GOAT Funded Futures - SPRINT',             code: 'Use Link For Best Discount' },
  { name: 'GOAT Funded Futures - INSTANT',            code: 'Use Link For Best Discount' },
  // FundedSeat
  { name: 'FundedSeat - 1 Step (Daily)',              code: 'RTF' },
  { name: 'FundedSeat - 1 Step (Sprint)',             code: 'RTF' },
  { name: 'FundedSeat - Instant Funding (Direct)',    code: 'RTF' },
  { name: 'FundedSeat - Instant Funding (Bolt)',      code: 'RTF' },
];

const fix = async () => {
  const client = await pool.connect();
  let updated = 0;
  let notFound = 0;

  try {
    for (const { name, code } of updates) {
      const r = await client.query(
        'UPDATE prop_firms SET discount_code = $1 WHERE name = $2 RETURNING id',
        [code, name]
      );
      if (r.rowCount > 0) {
        console.log(`✅  ${name} → ${code || '(none)'}`);
        updated++;
      } else {
        console.log(`⚠️  Not found: ${name}`);
        notFound++;
      }
    }
    console.log(`\n🎉  Done! ${updated} updated, ${notFound} not found in DB.`);
  } catch (err) {
    console.error('❌  Error:', err.message);
  } finally {
    client.release();
    process.exit(0);
  }
};

fix();
