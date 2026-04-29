// pages/index.js（または既存のニュース雨コンポーネントと置き換え）
import { useState, useEffect, useRef, useCallback } from "react";

// ★ここだけ変える：自分のVercelドメインに合わせる
const NEWS_API = "/api/news";

const SPEED_OPTIONS = [
  { label: "ゆっくり", value: 9000, icon: "🐢" },
  { label: "ふつう",   value: 5000, icon: "🚶" },
  { label: "はやい",   value: 2800, icon: "🚀" },
];
const DURATION_OPTIONS = [
  { label: "10秒", value: 10 },
  { label: "20秒", value: 20 },
  { label: "30秒", value: 30 },
];
const TOPIC_COLORS = {
  "経済":"#F59E0B","テクノロジー":"#3B82F6","スポーツ":"#10B981",
  "天気":"#06B6D4","政治":"#8B5CF6","エンタメ":"#EC4899",
  "健康":"#84CC16","科学":"#F97316","国際":"#6366F1",
  "社会":"#EF4444","ビジネス":"#14B8A6","IT":"#3B82F6",
  "default":"#64748B",
};
const SOURCE_FLAG = { "Reuters":"🇺🇸", "Al Jazeera":"🇶🇦", "BBC":"🇬🇧" };
const TOPIC_EMOJI = {
  "経済":"💴","政治":"🏛️","スポーツ":"⚽","テクノロジー":"💻",
  "エンタメ":"🎬","健康":"💊","科学":"🔬","国際":"🌏",
  "社会":"📢","ビジネス":"📊","IT":"🖥️"
};

function colorFor(t) { return TOPIC_COLORS[t] || TOPIC_COLORS.default; }

// ── Falling card ──────────────────────────────────────────────
function NewsCard({ item, onCatch, duration }) {
  const [y, setY] = useState(-180);
  const [wobble, setWobble] = useState(0);
  const [caught, setCaught] = useState(false);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const screenH = window.innerHeight;

  useEffect(() => {
    const animate = ts => {
      if (!startRef.current) startRef.current = ts;
      const p = Math.min((ts - startRef.current) / duration, 1);
      setY(-180 + (screenH + 220) * p);
      setWobble(Math.sin((ts - startRef.current) / 280) * 2.5);
      if (p < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [duration, screenH]);

  const tap = () => {
    if (caught) return;
    setCaught(true);
    cancelAnimationFrame(rafRef.current);
    onCatch(item);
  };

  return (
    <div onClick={tap} style={{
      position: "absolute", left: item.x, top: y, width: item.w,
      transform: `rotate(${item.rot + wobble}deg) scale(${caught ? 1.12 : 1})`,
      transition: caught ? "opacity 0.35s, transform 0.15s" : "transform 0.08s",
      opacity: caught ? 0 : 1,
      cursor: "pointer", borderRadius: 14, background: "#fff",
      border: `2px solid ${item.color}55`,
      boxShadow: `0 5px 20px rgba(0,0,0,0.10), 0 0 0 1px ${item.color}18`,
      userSelect: "none", WebkitTapHighlightColor: "transparent", overflow: "hidden",
    }}>
      <div style={{ height: 4, background: item.color }} />
      <div style={{ padding: "8px 10px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 5 }}>
          <div style={{
            background: item.color, color: "#fff",
            fontSize: 9, fontWeight: 800,
            padding: "2px 7px", borderRadius: 4,
            fontFamily: "'Noto Sans JP', sans-serif",
          }}>{item.topic}</div>
          <div style={{ fontSize: 10, color: "#94a3b8" }}>
            {SOURCE_FLAG[item.source] || "🌐"}
          </div>
        </div>
        <div style={{
          fontSize: 11, fontWeight: 700, color: "#1e293b", lineHeight: 1.45,
          fontFamily: "'Noto Sans JP', sans-serif",
          display: "-webkit-box", WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>{item.title}</div>
      </div>
    </div>
  );
}

// ── Detail modal ──────────────────────────────────────────────
function DetailModal({ item, onClose }) {
  if (!item) return null;
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(15,23,42,0.38)",
      backdropFilter: "blur(6px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      animation: "fdIn 0.2s ease",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "100%", maxWidth: 480,
        background: "#fff", borderRadius: "24px 24px 0 0",
        overflow: "hidden",
        animation: "slUp 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        paddingBottom: 40,
      }}>
        <div style={{ height: 5, background: item.color }} />
        <div style={{ padding: "20px 24px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                background: item.color, color: "#fff",
                fontSize: 11, fontWeight: 800,
                padding: "3px 10px", borderRadius: 6,
                fontFamily: "'Noto Sans JP', sans-serif",
              }}>{item.topic}</div>
              <div style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>
                {SOURCE_FLAG[item.source]} {item.source}
              </div>
            </div>
            <button onClick={onClose} style={{
              background: "#f1f5f9", border: "none",
              borderRadius: "50%", width: 34, height: 34,
              cursor: "pointer", fontSize: 16, color: "#64748b",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>✕</button>
          </div>
          <h2 style={{
            margin: "0 0 6px", fontSize: 19, fontWeight: 900,
            color: "#0f172a", lineHeight: 1.45,
            fontFamily: "'Noto Sans JP', sans-serif",
          }}>{item.title}</h2>
          {item.originalTitle && item.originalTitle !== item.title && (
            <div style={{
              fontSize: 12, color: "#94a3b8", marginBottom: 12,
              fontStyle: "italic",
            }}>{item.originalTitle}</div>
          )}
          <p style={{
            margin: "0 0 20px", fontSize: 15, color: "#475569", lineHeight: 1.8,
            fontFamily: "'Noto Sans JP', sans-serif",
          }}>{item.description || "詳細情報がありません。"}</p>
          {item.link && (
            <a href={item.link} target="_blank" rel="noopener noreferrer" style={{
              display: "block", textAlign: "center", padding: "13px",
              background: item.color, color: "#fff", borderRadius: 12,
              fontWeight: 800, fontSize: 14,
              fontFamily: "'Noto Sans JP', sans-serif",
              textDecoration: "none",
            }}>原文を読む {SOURCE_FLAG[item.source]} →</a>
          )}
        </div>
      </div>
      <style>{`
        @keyframes fdIn { from{opacity:0} to{opacity:1} }
        @keyframes slUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
      `}</style>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function App() {
  const [phase, setPhase] = useState("select");
  const [speed, setSpeed] = useState(SPEED_OPTIONS[1]);
  const [dur, setDur]     = useState(DURATION_OPTIONS[1]);
  const [news, setNews]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchErr, setFetchErr] = useState(null);

  const [falling, setFalling]   = useState([]);
  const [caught, setCaught]     = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [detail, setDetail]     = useState(null);

  const spawnRef = useRef(null);
  const timerRef = useRef(null);
  const idxRef   = useRef(0);

  const loadNews = useCallback(() => {
    setLoading(true);
    setFetchErr(null);
    fetch(NEWS_API)
      .then(r => r.json())
      .then(d => {
        if (d.ok && d.items?.length) {
          setNews(d.items.map(it => ({ ...it, color: colorFor(it.topic) })));
        } else throw new Error(d.error || "取得失敗");
      })
      .catch(e => setFetchErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadNews(); }, [loadNews]);

  const spawn = useCallback(() => {
    if (!news.length) return;
    const item = news[idxRef.current % news.length];
    idxRef.current++;
    const w = Math.floor(Math.random() * 55 + 115);
    const maxX = Math.min(window.innerWidth, 480) - w - 8;
    const x = Math.floor(Math.random() * maxX + 4);
    const rot = (Math.random() - 0.5) * 10;
    setFalling(prev => [...prev, { ...item, uid: Date.now() + Math.random(), w, x, rot }]);
  }, [news]);

  const startRain = () => {
    setCaught([]); setFalling([]);
    idxRef.current = Math.floor(Math.random() * news.length);
    setTimeLeft(dur.value);
    setPhase("rain");
  };

  useEffect(() => {
    if (phase !== "rain") return;
    spawn();
    spawnRef.current = setInterval(spawn, 1100);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          clearInterval(spawnRef.current);
          setTimeout(() => setPhase("feed"), 500);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { clearInterval(timerRef.current); clearInterval(spawnRef.current); };
  }, [phase, spawn]);

  const handleCatch = item =>
    setCaught(prev => prev.find(i => i.id === item.id) ? prev : [...prev, item]);

  // ── SELECT ──────────────────────────────────
  if (phase === "select") return (
    <div style={{
      minHeight: "100dvh",
      background: "linear-gradient(160deg,#f8faff 0%,#eef2ff 60%,#fdf4ff 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'Noto Sans JP', sans-serif",
      padding: "24px 20px",
    }}>
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ fontSize: 56, marginBottom: 4, filter: "drop-shadow(0 4px 14px rgba(99,102,241,0.28))" }}>🌧️</div>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.02em" }}>ニュース雨</h1>
        <p style={{ margin: "6px 0 0", fontSize: 12, color: "#94a3b8" }}>
          🇺🇸 Reuters・🇶🇦 Al Jazeera・🇬🇧 BBC
        </p>
        <p style={{ margin: "6px 0 0", fontSize: 13, color: loading ? "#94a3b8" : fetchErr ? "#EF4444" : "#22c55e" }}>
          {loading ? "⏳ ニュース翻訳中…（15〜20秒）" : fetchErr ? `⚠️ ${fetchErr}` : `✓ ${news.length}件 準備完了`}
        </p>
        {fetchErr && (
          <button onClick={loadNews} style={{
            marginTop: 8, padding: "6px 18px",
            background: "#fff", border: "1.5px solid #e2e8f0",
            borderRadius: 20, fontSize: 12, color: "#6366F1",
            cursor: "pointer", fontWeight: 700,
            fontFamily: "'Noto Sans JP', sans-serif",
          }}>再取得</button>
        )}
      </div>

      <div style={{ width: "100%", maxWidth: 340 }}>
        <div style={{ background: "#fff", borderRadius: 20, padding: 20, marginBottom: 14, boxShadow: "0 2px 18px rgba(0,0,0,0.06)" }}>
          <p style={{ margin: "0 0 14px", fontSize: 11, color: "#94a3b8", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>落下スピード</p>
          <div style={{ display: "flex", gap: 8 }}>
            {SPEED_OPTIONS.map(o => (
              <button key={o.value} onClick={() => setSpeed(o)} style={{
                flex: 1, padding: "12px 4px", borderRadius: 12,
                border: speed.value === o.value ? "2px solid #6366F1" : "2px solid #e2e8f0",
                background: speed.value === o.value ? "#eef2ff" : "#f8fafc",
                color: speed.value === o.value ? "#4338CA" : "#64748b",
                fontSize: 11, fontWeight: 800, cursor: "pointer",
                fontFamily: "'Noto Sans JP', sans-serif", transition: "all 0.15s",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              }}><span style={{ fontSize: 22 }}>{o.icon}</span>{o.label}</button>
            ))}
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 20, padding: 20, marginBottom: 14, boxShadow: "0 2px 18px rgba(0,0,0,0.06)" }}>
          <p style={{ margin: "0 0 14px", fontSize: 11, color: "#94a3b8", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>プレイ時間</p>
          <div style={{ display: "flex", gap: 8 }}>
            {DURATION_OPTIONS.map(o => (
              <button key={o.value} onClick={() => setDur(o)} style={{
                flex: 1, padding: "13px 4px", borderRadius: 12,
                border: dur.value === o.value ? "2px solid #F59E0B" : "2px solid #e2e8f0",
                background: dur.value === o.value ? "#fffbeb" : "#f8fafc",
                color: dur.value === o.value ? "#B45309" : "#64748b",
                fontSize: 15, fontWeight: 800, cursor: "pointer",
                fontFamily: "'Noto Sans JP', sans-serif", transition: "all 0.15s",
              }}>{o.label}</button>
            ))}
          </div>
        </div>

        <button onClick={startRain} disabled={loading || !!fetchErr || !news.length} style={{
          width: "100%", padding: "17px", borderRadius: 16, border: "none",
          background: (!loading && !fetchErr && news.length) ? "linear-gradient(135deg,#6366F1,#8B5CF6)" : "#e2e8f0",
          color: (!loading && !fetchErr && news.length) ? "#fff" : "#94a3b8",
          fontSize: 17, fontWeight: 900,
          cursor: (!loading && !fetchErr && news.length) ? "pointer" : "default",
          fontFamily: "'Noto Sans JP', sans-serif",
          boxShadow: (!loading && !fetchErr && news.length) ? "0 6px 24px rgba(99,102,241,0.38)" : "none",
          transition: "all 0.2s",
        }}>{loading ? "翻訳中…" : "スタート ▶"}</button>
      </div>
    </div>
  );

  // ── RAIN ──────────────────────────────────────
  if (phase === "rain") {
    const pct = (timeLeft / dur.value) * 100;
    return (
      <div style={{
        width: "100dvw", height: "100dvh",
        background: "linear-gradient(180deg,#f0f4ff 0%,#fafbff 100%)",
        overflow: "hidden", position: "relative", touchAction: "none",
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, background: "#e2e8f0", zIndex: 99 }}>
          <div style={{
            height: "100%", width: `${pct}%`,
            background: pct > 30 ? "linear-gradient(90deg,#6366F1,#8B5CF6)" : "linear-gradient(90deg,#F59E0B,#EF4444)",
            transition: "width 1s linear, background 0.4s",
          }}/>
        </div>
        <div style={{
          position: "absolute", top: 14, left: 0, right: 0,
          display: "flex", justifyContent: "space-between",
          padding: "0 16px", zIndex: 99, fontFamily: "'Noto Sans JP', sans-serif",
        }}>
          <div style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(6px)", borderRadius: 20, padding: "5px 14px", color: "#6366F1", fontSize: 13, fontWeight: 800, boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
            🎯 {caught.length}件
          </div>
          <div style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(6px)", borderRadius: 20, padding: "5px 14px", color: pct > 30 ? "#0f172a" : "#EF4444", fontSize: 13, fontWeight: 800, boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
            ⏱ {timeLeft}s
          </div>
        </div>

        {falling.map(item => (
          <NewsCard key={item.uid} item={item} onCatch={handleCatch} duration={speed.value} />
        ))}

        {caught.length === 0 && timeLeft === dur.value && (
          <div style={{
            position: "absolute", bottom: 50, left: 0, right: 0,
            textAlign: "center", color: "rgba(100,116,139,0.6)",
            fontSize: 14, fontFamily: "'Noto Sans JP', sans-serif",
            animation: "bob 2s ease-in-out infinite",
          }}>タップしてキャッチ！</div>
        )}
        <style>{`@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}`}</style>
      </div>
    );
  }

  // ── FEED ──────────────────────────────────────
  const feed = caught.length > 0 ? caught : news.slice(0, 10);
  return (
    <div style={{ minHeight: "100dvh", background: "#f8fafc", fontFamily: "'Noto Sans JP', sans-serif" }}>
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(248,250,252,0.96)", backdropFilter: "blur(10px)",
        borderBottom: "1px solid #e2e8f0",
        padding: "14px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#0f172a" }}>
            {caught.length > 0 ? "キャッチしたニュース" : "最新ニュース"}
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{feed.length}件</div>
        </div>
        <button onClick={() => setPhase("select")} style={{
          background: "linear-gradient(135deg,#6366F1,#8B5CF6)",
          border: "none", color: "#fff", borderRadius: 20, padding: "7px 16px",
          fontSize: 12, fontWeight: 800, cursor: "pointer",
          fontFamily: "'Noto Sans JP', sans-serif",
          boxShadow: "0 3px 12px rgba(99,102,241,0.35)",
        }}>↺ もう一度</button>
      </div>

      <div style={{ paddingBottom: 60 }}>
        {feed.map((item, i) => (
          <div key={item.id} onClick={() => setDetail(item)} style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "14px 20px",
            borderBottom: "1px solid #f1f5f9",
            background: "#fff", marginBottom: 1,
            cursor: "pointer", WebkitTapHighlightColor: "transparent",
            animation: `sIn 0.3s ease ${i * 0.04}s both`,
          }}>
            <div style={{
              width: 52, height: 52, flexShrink: 0, borderRadius: 12,
              background: `${item.color}18`,
              border: `2px solid ${item.color}33`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22,
            }}>{TOPIC_EMOJI[item.topic] || "📰"}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                <div style={{
                  background: item.color, color: "#fff",
                  fontSize: 10, fontWeight: 800,
                  padding: "2px 8px", borderRadius: 4,
                }}>{item.topic}</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>
                  {SOURCE_FLAG[item.source]} {item.source}
                </div>
              </div>
              <div style={{
                fontSize: 15, fontWeight: 700, color: "#0f172a", lineHeight: 1.45,
                display: "-webkit-box", WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical", overflow: "hidden",
              }}>{item.title}</div>
            </div>
            <div style={{ color: "#cbd5e1", fontSize: 20, flexShrink: 0 }}>›</div>
          </div>
        ))}
      </div>

      <style>{`@keyframes sIn{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:translateX(0)}}`}</style>
      {detail && <DetailModal item={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
