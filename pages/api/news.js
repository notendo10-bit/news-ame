// pages/api/news.js
// ロイター・アルジャジーラ・BBCのRSSを取得してClaudeで日本語翻訳して返す

const RSS_SOURCES = [
  { url: "https://feeds.reuters.com/reuters/topNews", source: "Reuters" },
  { url: "https://www.aljazeera.com/xml/rss/all.xml", source: "Al Jazeera" },
  { url: "https://feeds.bbci.co.uk/news/world/rss.xml", source: "BBC" },
];

const TOPIC_MAP = {
  "economy|market|finance|bank|trade|gdp|inflation|stock": "経済",
  "politi|election|government|minister|president|parliament|congress": "政治",
  "sport|football|soccer|tennis|olympic|basketball|baseball": "スポーツ",
  "tech|ai|digital|cyber|software|apple|google|microsoft|robot": "テクノロジー",
  "health|medicine|hospital|virus|cancer|covid|disease|drug": "健康",
  "science|space|nasa|climate|research|study|discovery": "科学",
  "war|conflict|military|army|attack|bomb|missile|ukraine|gaza": "国際",
  "entertain|film|movie|music|celebrity|award|actor": "エンタメ",
  "business|company|corporate|merger|startup|ceo": "ビジネス",
};

function guessTopic(text) {
  const lower = text.toLowerCase();
  for (const [pattern, label] of Object.entries(TOPIC_MAP)) {
    if (new RegExp(pattern).test(lower)) return label;
  }
  return "国際";
}

async function fetchRSS(source) {
  try {
    const res = await fetch(source.url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; NewsBot/1.0)" },
      signal: AbortSignal.timeout(6000),
    });
    const xml = await res.text();

    // シンプルなXMLパース（正規表現）
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null && items.length < 10) {
      const block = match[1];
      const title = (block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ||
                     block.match(/<title>(.*?)<\/title>/))?.[1]?.trim() || "";
      const desc  = (block.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) ||
                     block.match(/<description>(.*?)<\/description>/))?.[1]
                     ?.replace(/<[^>]+>/g, "").trim().slice(0, 200) || "";
      const link  = (block.match(/<link>(.*?)<\/link>/) ||
                     block.match(/<link[^>]*href="(.*?)"/))?.[1]?.trim() || "";
      if (title) items.push({ title, description: desc, link, source: source.source });
    }
    return items;
  } catch (e) {
    console.error(`RSS fetch failed: ${source.source}`, e.message);
    return [];
  }
}

async function translateWithClaude(items) {
  const payload = items.map((it, i) => ({
    i,
    title: it.title,
    description: it.description,
  }));

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4000,
      system: `あなたはニュース翻訳AIです。受け取ったJSON配列の各記事のtitleとdescriptionを自然な日本語に翻訳してください。
必ず同じインデックス数・同じ構造のJSON配列のみを返してください。説明文・マークダウン・バッククォートは一切不要です。
出力例: [{"i":0,"title":"翻訳タイトル","description":"翻訳概要"},...]`,
      messages: [{
        role: "user",
        content: `以下のニュース記事を日本語に翻訳してください:\n${JSON.stringify(payload)}`,
      }],
    }),
  });

  const data = await res.json();
  const text = data.content?.find(b => b.type === "text")?.text || "[]";
  const clean = text.replace(/```json|```/g, "").trim();
  const match = clean.match(/\[[\s\S]*\]/);
  if (!match) return null;
  return JSON.parse(match[0]);
}

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // 全ソースから並列取得
    const allItems = (await Promise.all(RSS_SOURCES.map(fetchRSS))).flat();

    // 重複排除（タイトル先頭30文字で判定）
    const seen = new Set();
    const unique = allItems.filter(it => {
      const key = it.title.slice(0, 30);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 20);

    // Claude で一括翻訳
    let translated = null;
    if (process.env.ANTHROPIC_API_KEY) {
      translated = await translateWithClaude(unique);
    }

    // 翻訳結果をマージ
    const result = unique.map((it, i) => {
      const t = translated?.find(x => x.i === i);
      return {
        id: i,
        title: t?.title || it.title,
        description: t?.description || it.description,
        link: it.link,
        source: it.source,
        topic: guessTopic(it.title + " " + it.description),
        originalTitle: it.title,
      };
    });

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
    return res.status(200).json({ ok: true, items: result });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e.message });
  }
}
