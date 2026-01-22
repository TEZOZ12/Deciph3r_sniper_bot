import TelegramBot from "node-telegram-bot-api";
import axios from "axios";

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const CHAT_ID = process.env.CHAT_ID;
const DEX_API = "https://api.dexscreener.com/latest/dex/search";

function momentumScore(pair) {
  let score = 0;
  if (pair.priceChange?.h1 > 15) score += 30;
  if (pair.priceChange?.h6 > 40) score += 25;
  if (pair.volume?.h1 > pair.volume?.h24 * 0.25) score += 25;
  if (pair.liquidity?.usd > 300_000) score += 10;
  return score;
}

async function scan() {
  const { data } = await axios.get(DEX_API, { params: { q: "meme" } });

  const hits = data.pairs
    .map(p => ({ p, score: momentumScore(p) }))
    .filter(x => x.score >= 70)
    .slice(0, 3);

  for (const hit of hits) {
    const p = hit.p;
    const msg = `
🚀 Momentum Alert
🪙 ${p.baseToken.symbol}
⛓ ${p.chainId}
📈 1H +${p.priceChange.h1}%
📊 Vol $${(p.volume.h24 / 1e6).toFixed(2)}M
💧 LP $${(p.liquidity.usd / 1000).toFixed(0)}K
🔥 Score ${hit.score}

${p.url}
    `;
    await bot.sendMessage(CHAT_ID, msg);
  }
}

setInterval(scan, 180000);
