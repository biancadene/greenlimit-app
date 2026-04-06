import { useMemo, useState, useEffect } from "react";
import "./index.css";
import leafBg from "./assets/leaf-bg.jpg";
import leafIcon from "./assets/leaf-icon.png";

const LIMITS = {
  Flower: { cap: 2.5, window: 35, unit: "oz" },
  Inhalation: { cap: 24500, window: 70, unit: "mg" },
  Edibles: { cap: 24500, window: 70, unit: "mg" },
  Oral: { cap: 24500, window: 70, unit: "mg" },
  Sublingual: { cap: 24500, window: 70, unit: "mg" },
  Topical: { cap: 24500, window: 70, unit: "mg" },
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

export default function App() {
  useEffect(() => {
    const existing = document.getElementById("greenlimit-fonts");
    if (!existing) {
      const link = document.createElement("link");
      link.id = "greenlimit-fonts";
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Sora:wght@600;700;800&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  const [purchases, setPurchases] = useState(() => {
    const saved = localStorage.getItem("greenlimit-data");
    return saved ? JSON.parse(saved) : [];
  });

  const [type, setType] = useState("Flower");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    localStorage.setItem("greenlimit-data", JSON.stringify(purchases));
  }, [purchases]);

  const activePurchases = useMemo(() => {
    const now = new Date();
    return purchases.filter((purchase) => {
      const expires = addDays(purchase.date, LIMITS[purchase.type].window);
      return expires > now;
    });
  }, [purchases]);

  const totals = useMemo(() => {
    const result = {};
    Object.keys(LIMITS).forEach((key) => {
      result[key] = activePurchases
        .filter((purchase) => purchase.type === key)
        .reduce((sum, purchase) => sum + Number(purchase.amount), 0);
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
    if (activePurchases.length === 0) return null;
    const resetDates = activePurchases.map((purchase) =>
      addDays(purchase.date, LIMITS[purchase.type].window)
    );
    resetDates.sort((a, b) => a - b);
    return resetDates[0];
  }, [activePurchases]);

  const selectedRemaining = remaining[type];
  const selectedUnit = LIMITS[type].unit;
  const bannerState = getBannerState(selectedRemaining, LIMITS[type].cap);
  const bannerMessage = getBannerMessage(bannerState);

  function addPurchase() {
    if (!amount || Number(amount) <= 0) return;

    const newPurchase = {
      id: Date.now(),
      type,
      amount: Number(amount),
      date,
    };

    setPurchases([newPurchase, ...purchases]);
    setAmount("");
  }

  function deletePurchase(id) {
    setPurchases((prev) => prev.filter((purchase) => purchase.id !== id));
  }

  function clearAllPurchases() {
    const confirmed = window.confirm(
      "Clear all tracked purchases? This cannot be undone."
    );
    if (confirmed) {
      setPurchases([]);
    }
  }

  return (
    <div className="page-shell" style={{ "--leaf-bg": `url(${leafBg})` }}>
      <div className="image-overlay" />
      <div className="glow glow-green" />
      <div className="glow glow-gold" />
      <div className="glow glow-red" />

      <main className="app-frame">
        <div className="phone-shell">
          <div className="phone-top">
            <div className="phone-status">
              <span>9:41</span>
              <div className="status-icons">
                <span className="status-dot" />
                <span className="status-dot" />
                <span className="status-pill" />
              </div>
            </div>
            <div className="phone-notch" />
          </div>

          <section className={`top-banner top-banner--${bannerState}`}>
            <p className="top-banner-label">available right now</p>
            <h2 className="top-banner-value">
              {formatAmount(selectedRemaining, selectedUnit)}
            </h2>
            <p className="top-banner-text">{bannerMessage} · based on your usage</p>
          </section>

          <section className="hero-card">
            <div className="brand-row">
              <div className="app-icon image-app-icon" aria-hidden="true">
                <img src={leafIcon} alt="" className="app-icon-image" />
              </div>

              <div className="brand-copy">
                <div className="eyebrow">medical cannabis tracker</div>
                <h1>GreenLimit</h1>
              </div>
            </div>

            <p className="hero-subtitle">
              Track flower, inhalation, edibles, oral products, sublinguals, and
              topicals in one clear mobile-friendly dashboard for top-ups, reset
              windows, and everyday clarity.
            </p>

            <div className="hero-pills">
              <span className="pill pill-green">flower tracking</span>
              <span className="pill pill-gold">reset windows</span>
              <span className="pill pill-red">top-up planning</span>
              <span className="pill pill-green">caregiver-friendly</span>
            </div>
          </section>

          <section className="panel snapshot-panel">
            <div className="panel-header">
              <div>
                <p className="panel-kicker">snapshot</p>
                <h2>Today</h2>
              </div>
            </div>

            <div className="summary-grid">
              <div className="summary-box">
                <span>Flower available</span>
                <strong>
                  {formatNumber(remaining.Flower)} {LIMITS.Flower.unit}
                </strong>
              </div>

              <div className="summary-box">
                <span>Next reset</span>
                <strong>{nextReset ? formatDate(nextReset) : "—"}</strong>
              </div>

              <div className="summary-box">
                <span>Active purchases</span>
                <strong>{activePurchases.length}</strong>
              </div>

              <div className="summary-box">
                <span>Current category</span>
                <strong>{type}</strong>
              </div>
            </div>
          </section>

          <section className="stats-grid">
            {Object.keys(LIMITS).map((key) => {
              const used = totals[key];
              const cap = LIMITS[key].cap;
              const unit = LIMITS[key].unit;
              const percent = Math.min(100, (used / cap) * 100);

              return (
                <article className="stat-card" key={key}>
                  <div className="stat-top">
                    <p className="stat-title">{key}</p>
                    <span className="stat-window">{LIMITS[key].window} days</span>
                  </div>

                  <p className="stat-remaining">
                    {formatNumber(remaining[key])} <span>{unit} left</span>
                  </p>

                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <p className="stat-meta">
                    Used {formatNumber(used)} of {formatNumber(cap)} {unit}
                  </p>
                </article>
              );
            })}
          </section>

          <section className="panel panel-form">
            <div className="panel-header">
              <div>
                <p className="panel-kicker">log a purchase</p>
                <h2>Add a new entry</h2>
              </div>
            </div>

            <div className="form-grid">
              <div className="field">
                <label>Category</label>
                <select value={type} onChange={(e) => setType(e.target.value)}>
                  {Object.keys(LIMITS).map((key) => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Amount ({LIMITS[type].unit})</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="field full-width">
                <label>Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
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

          <section className="panel history-panel">
            <div className="panel-header">
              <div>
                <p className="panel-kicker">recent activity</p>
                <h2>Purchase history</h2>
              </div>
            </div>

            {purchases.length === 0 ? (
              <p className="empty-state">No purchases yet.</p>
            ) : (
              <div className="history-list">
                {purchases.map((purchase) => {
                  const resetDate = addDays(
                    purchase.date,
                    LIMITS[purchase.type].window
                  );

                  return (
                    <div className="history-row" key={purchase.id}>
                      <div className="history-row-top">
                        <div>
                          <p className="history-type">{purchase.type}</p>
                          <p className="history-date">
                            Bought {formatDate(purchase.date)}
                          </p>
                        </div>

                        <div className="history-amount-block">
                          <p className="history-amount">
                            {formatNumber(purchase.amount)}{" "}
                            {LIMITS[purchase.type].unit}
                          </p>
                          <p className="history-reset">
                            Resets {formatDate(resetDate)}
                          </p>
                        </div>
                      </div>

                      <div className="history-row-bottom">
                        <div className="history-tag">
                          {LIMITS[purchase.type].window}-day window
                        </div>

                        <button
                          className="delete-button"
                          onClick={() => deletePurchase(purchase.id)}
                        >
                          Delete
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