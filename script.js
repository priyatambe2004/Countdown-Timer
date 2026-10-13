// ---- Default configuration (edit these) ----
const DEFAULT_NAME = "New Year 2027";
const DEFAULT_DATE = "2027-01-01T00:00:00";
const DONE_MESSAGE = "🎉 The wait is over!";
// --------------------------------------------

const $ = (id) => document.getElementById(id);
const pad = (n) => String(n).padStart(2, "0");

const els = {
  days: $("days"), hours: $("hours"), minutes: $("minutes"), seconds: $("seconds"),
  timer: $("timer"), message: $("message"), title: $("title"), targetText: $("targetText"),
  progressBox: $("progressBox"), fill: $("fill"), percent: $("percent"),
  form: $("form"), nameInput: $("nameInput"), dateInput: $("dateInput"), error: $("error"),
};

let target, startTime, intervalId;

/* ---------- storage (wrapped: can fail in private mode) ---------- */
function save(key, val) { try { localStorage.setItem(key, val); } catch (e) {} }
function load(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }

/* ---------- countdown ---------- */
function setCountdown(name, date, start = Date.now()) {
  target = new Date(date);
  startTime = start;
  clearInterval(intervalId);

  els.title.textContent = name;
  document.title = name + " – Countdown";
  els.targetText.textContent = "Counting down to " + target.toLocaleString([], { dateStyle: "full", timeStyle: "short" });
  els.timer.hidden = false;
  els.progressBox.hidden = false;
  els.message.hidden = true;
  Object.values(els).forEach((el) => el.classList && el.classList.remove("tick"));

  save("cd", JSON.stringify({ name, date: target.toISOString(), start }));

  update();
  intervalId = setInterval(update, 1000);
}

function setText(el, value) {
  if (el.textContent !== value) {
    el.textContent = value;
    el.classList.remove("tick");
    void el.offsetWidth;          // restart the animation
    el.classList.add("tick");
  }
}

function update() {
  const diff = target - new Date();

  if (diff <= 0) {                // finished, or date already passed
    clearInterval(intervalId);
    els.timer.hidden = true;
    els.progressBox.hidden = true;
    els.message.textContent = DONE_MESSAGE;
    els.message.hidden = false;
    launchConfetti();
    return;
  }

  const s = Math.floor(diff / 1000);
  setText(els.days, pad(Math.floor(s / 86400)));
  setText(els.hours, pad(Math.floor((s % 86400) / 3600)));
  setText(els.minutes, pad(Math.floor((s % 3600) / 60)));
  setText(els.seconds, pad(s % 60));

  const total = target - startTime;
  const pct = total > 0 ? Math.min(100, Math.max(0, ((Date.now() - startTime) / total) * 100)) : 0;
  els.fill.style.width = pct + "%";
  els.percent.textContent = pct.toFixed(1) + "% elapsed";
}

/* ---------- form + presets ---------- */
els.form.addEventListener("submit", (e) => {
  e.preventDefault();
  const chosen = new Date(els.dateInput.value);
  if (isNaN(chosen)) { els.error.textContent = "Please pick a valid date and time."; return; }
  if (chosen <= new Date()) { els.error.textContent = "That date has already passed. Pick a future date."; return; }
  els.error.textContent = "";
  setCountdown(els.nameInput.value.trim() || "My event", chosen);
});

$("presets").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  els.error.textContent = "";
  els.nameInput.value = b.dataset.name;
  els.dateInput.value = b.dataset.date;
  setCountdown(b.dataset.name, b.dataset.date);
});

/* ---------- theme ---------- */
const themeBtn = $("themeBtn");
function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  themeBtn.textContent = t === "dark" ? "🌙" : "☀️";
  save("theme", t);
}
themeBtn.addEventListener("click", () => {
  applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
});
applyTheme(load("theme") || "dark");

/* ---------- confetti ---------- */
function launchConfetti() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const c = $("confetti"), ctx = c.getContext("2d");
  c.width = innerWidth; c.height = innerHeight;
  const colors = ["#f26a1b", "#f7a24b", "#4da3ff", "#7be0a5", "#ffd84d", "#ff6b9a"];
  const bits = Array.from({ length: 160 }, () => ({
    x: Math.random() * c.width, y: -20 - Math.random() * c.height * 0.5,
    w: 6 + Math.random() * 6, h: 8 + Math.random() * 8,
    vy: 2 + Math.random() * 3, vx: -1 + Math.random() * 2,
    r: Math.random() * 6, vr: -.2 + Math.random() * .4,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));
  const end = Date.now() + 5000;
  (function frame() {
    ctx.clearRect(0, 0, c.width, c.height);
    bits.forEach((p) => {
      p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.fillStyle = p.color; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
    });
    if (Date.now() < end) requestAnimationFrame(frame); else ctx.clearRect(0, 0, c.width, c.height);
  })();
}

/* ---------- start: restore saved countdown or use default ---------- */
let saved = null;
try { saved = JSON.parse(load("cd")); } catch (e) {}
if (saved && !isNaN(new Date(saved.date))) {
  els.nameInput.value = saved.name;
  els.dateInput.value = saved.date.slice(0, 16);
  setCountdown(saved.name, saved.date, saved.start);
} else {
  els.nameInput.value = DEFAULT_NAME;
  els.dateInput.value = DEFAULT_DATE.slice(0, 16);
  setCountdown(DEFAULT_NAME, DEFAULT_DATE);
}
