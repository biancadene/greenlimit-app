import { useMemo, useState, useEffect } from "react";
import "./index.css";

const LIMITS = {
  Flower:     { cap: 2.5,   window: 35, unit: "oz" },
  Inhalation: { cap: 24500, window: 70, unit: "mg" },
  Edibles:    { cap: 24500, window: 70, unit: "mg" },
  Oral:       { cap: 24500, window: 70, unit: "mg" },
  Sublingual: { cap: 24500, window: 70, unit: "mg" },
  Topical:    { cap: 24500, window: 70, unit: "mg" },
};

function formatNumber(value) {
  return value % 1 === 0 ? value.toLocaleString() : value.toFixed(2);
}

function formatAmount(value, unit) {
  if (unit === "oz") return `${value.toFixed(2)} ${unit}`;
  return `${value.toLocaleString()} ${unit}`;
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function addDays(dateString, days) {
  const date = new Date(dateString);
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function getBannerState(remainingValue, cap) {
  const ratio = remainingValue / cap;
  if (ratio <= 0.2) return "danger";
  if (ratio <= 0.5) return "warning";
  return "safe";
}

function getBannerMessage(state) {
  if (state === "danger") return "Almost at limit";
  if (state === "warning") return "Getting close";
  return "Plenty left";
}

/* ── GL Logo mark (inline SVG, no external image needed) ── */
function GLMark({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Progress arc track */}
      <circle cx="18" cy="18" r="14" stroke="#1a3028" strokeWidth="3" fill="none"/>
      {/* Progress arc fill ~60% used */}
      <path
        d="M18 4 A14 14 0 1 1 4.1 22.5"
        stroke="#1D9E75" strokeWidth="3" strokeLinecap="round" fill="none"
      />
      {/* Gold limit dot */}
      <circle cx="4.1" cy="22.5" r="3" fill="#C8A84B"/>
      {/* GL center text */}
      <text x="18" y="22" textAnchor="middle" fontFamily="DM Sans, system-ui, sans-serif"
        fontSize="10" fontWeight="600" fill="#fff" letterSpacing="-0.5">
        <tspan fill="#fff">G</tspan><tspan fill="#C8A84B">L</tspan>
      </text>
    </svg>
  );
}

/* ── Wordmark ── */
function Wordmark({ size = 18 }) {
  const tick = size * 0.33;
  return (
    <div className="gl-logo" style={{ fontSize: size }}>
      <span className="gl-logo-green">GREEN</span>
      <span className="gl-logo-l-wrap">
        <span className="gl-logo-tick" style={{ height: tick, top: -tick }} />
        <span className="gl-logo-l">L</span>
      </span>
      <span className="gl-logo-imit">IMIT</span>
    </div>
  );
}

/* ── Bar that mirrors the wordmark's L-marker concept ── */
function LimitBar({ used, cap }) {
  const pct = Math.min(100, (used / cap) * 100);
  const color = pct >= 80 ? "#c0392b" : pct >= 50 ? "#C8A84B" : "#1D9E75";
  return (
    <div className="progress-track" style={{ position: "relative" }}>
      <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      {/* The L-marker: gold tick at the limit boundary */}
      <div style={{
        position: "absolute", top: -5, right: 0,
        width: 2, height: 14, background: "#C8A84B",
        borderRadius: 1, opacity: 0.6,
      }} />
    </div>
  );
}

export default function App() {
  const [purchases, setPurchases] = useState(() => {
    try {
      const saved = localStorage.getItem("greenlimit-data");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [type, setType]     = useState("Flower");
  const [amount, setAmount] = useState("");
  const [date, setDate]     = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    localStorage.setItem("greenlimit-data", JSON.stringify(purchases));
  }, [purchases]);

  const activePurchases = useMemo(() => {
    const now = new Date();
    return purchases.filter((p) => addDays(p.date, LIMITS[p.type].window) > now);
  }, [purchases]);

  const totals = useMemo(() => {
    const result = {};
    Object.keys(LIMITS).forEach((key) => {
      result[key] = activePurchases
        .filter((p) => p.type === key)
        .reduce((sum, p) => sum + Number(p.amount), 0);
    });
    return result;
  }, [activePurchases]);

  const remaining = useMemo(() => {
    const result = {};
    Object.keys(LIMITS).forEach((key) => {
      result[key] = Math.max(0, LIMITS[key].cap - totals[key]);
    });
    return result;
  }, [totals]);

  const nextReset = useMemo(() => {
    if (!activePurchases.length) return null;
    const dates = activePurchases.map((p) => addDays(p.date, LIMITS[p.type].window));
    dates.sort((a, b) => a - b);
    return dates[0];
  }, [activePurchases]);

  const selectedRemaining = remaining[type];
  const selectedUnit      = LIMITS[type].unit;
  const bannerState       = getBannerState(selectedRemaining, LIMITS[type].cap);
  const bannerMessage     = getBannerMessage(bannerState);

  function addPurchase() {
    if (!amount || Number(amount) <= 0) return;
    setPurchases([{ id: Date.now(), type, amount: Number(amount), date }, ...purchases]);
    setAmount("");
  }

  function deletePurchase(id) {
    setPurchases((prev) => prev.filter((p) => p.id !== id));
  }

  function clearAllPurchases() {
    if (window.confirm("Clear all tracked purchases? This cannot be undone.")) {
      setPurchases([]);
    }
  }

  return (
    <div className="page-shell">
      <main className="app-frame">
        <div className="phone-shell">

          {/* ── STATUS BAR / BRAND HEADER ── */}
          <div className="gl-statusbar">
            <Wordmark size={18} />
            <div className="gl-statusbar-right">
              <span className="gl-badge">MEDICAL</span>
              <GLMark size={28} />
            </div>
          </div>

          {/* ── AVAILABLE BANNER ── */}
          <section className={`top-banner top-banner--${bannerState}`}>
            <p className="top-banner-label">available right now · {type}</p>
            <h2 className="top-banner-value">
              {formatAmount(selectedRemaining, selectedUnit)}
            </h2>
            <p className="top-banner-text">{bannerMessage} · based on your usage</p>
          </section>

          {/* ── HERO / INTRO (minimal) ── */}
          <section className="hero-card">
            <p className="hero-subtitle">
              Track flower, inhalation, edibles, oral, sublingual, and topical
              products across 35- and 70-day windows.
            </p>
            <div className="hero-pills">
              <span className="pill pill-green">flower tracking</span>
              <span className="pill pill-gold">reset windows</span>
              <span className="pill pill-red">limit alerts</span>
              <span className="pill pill-green">caregiver-friendly</span>
            </div>
          </section>

          {/* ── SNAPSHOT ── */}
          <section className="panel snapshot-panel">
            <div className="panel-header">
              <div>
                <p className="panel-kicker">snapshot</p>
                <h2>Today</h2>
              </div>
            </div>
            <div className="summary-grid">
              <div className="summary-box">
                <span>flower available</span>
                <strong>{formatNumber(remaining.Flower)} {LIMITS.Flower.unit}</strong>
              </div>
              <div className="summary-box">
                <span>next reset</span>
                <strong>{nextReset ? formatDate(nextReset) : "—"}</strong>
              </div>
              <div className="summary-box">
                <span>active purchases</span>
                <strong>{activePurchases.length}</strong>
              </div>
              <div className="summary-box">
                <span>current category</span>
                <strong>{type}</strong>
              </div>
            </div>
          </section>

          {/* ── CATEGORY STATS ── */}
          <div className="stats-grid">
            {Object.keys(LIMITS).map((key) => {
              const used    = totals[key];
              const cap     = LIMITS[key].cap;
              const unit    = LIMITS[key].unit;
              return (
                <article className="stat-card" key={key}>
                  <div className="stat-top">
                    <p className="stat-title">{key}</p>
                    <span className="stat-window">{LIMITS[key].window}d</span>
                  </div>
                  <p className="stat-remaining">
                    {formatNumber(remaining[key])} <span>{unit} left</span>
                  </p>
                  <LimitBar used={used} cap={cap} />
                  <p className="stat-meta">
                    {formatNumber(used)} / {formatNumber(cap)} {unit} used
                  </p>
                </article>
              );
            })}
          </div>

          {/* ── LOG PURCHASE ── */}
          <section className="panel panel-form">
            <div className="panel-header">
              <div>
                <p className="panel-kicker">log a purchase</p>
                <h2>Add entry</h2>
              </div>
            </div>
            <div className="form-grid">
              <div className="field">
                <label>Category</label>
                <select value={type} onChange={(e) => setType(e.target.value)}>
                  {Object.keys(LIMITS).map((key) => (
                    <option key={key} value={key}>{key}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Amount ({LIMITS[type].unit})</label>
                <input
                  type="number" step="0.01" placeholder="0.00"
                  value={amount} onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="field full-width">
                <label>Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>
            <div className="button-row">
              <button className="primary-button" onClick={addPurchase}>
                Add purchase
              </button>
              <button className="secondary-button" onClick={clearAllPurchases}>
                Clear all
              </button>
            </div>
          </section>

          {/* ── HISTORY ── */}
          <section className="panel history-panel">
            <div className="panel-header">
              <div>
                <p className="panel-kicker">recent activity</p>
                <h2>Purchase history</h2>
              </div>
            </div>
            {purchases.length === 0 ? (
              <p className="empty-state">no purchases yet</p>
            ) : (
              <div className="history-list">
                {purchases.map((p) => {
                  const resetDate = addDays(p.date, LIMITS[p.type].window);
                  return (
                    <div className="history-row" key={p.id}>
                      <div className="history-row-top">
                        <div>
                          <p className="history-type">{p.type}</p>
                          <p className="history-date">Bought {formatDate(p.date)}</p>
                        </div>
                        <div className="history-amount-block">
                          <p className="history-amount">
                            {formatNumber(p.amount)} {LIMITS[p.type].unit}
                          </p>
                          <p className="history-reset">Resets {formatDate(resetDate)}</p>
                        </div>
                      </div>
                      <div className="history-row-bottom">
                        <span className="history-tag">{LIMITS[p.type].window}-day window</span>
                        <button className="delete-button" onClick={() => deletePurchase(p.id)}>
                          delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

        </div>
      </main>
    </div>
  );
}
