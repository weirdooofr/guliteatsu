const express = require('express');
const basicAuth = require('express-basic-auth');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// ---- Configuration ----
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'changeme'; // CHANGE IN PRODUCTION
const DATA_FILE = path.join(__dirname, 'analytics.json');

// ---- Middleware ----
app.use(express.json());
app.use(express.static(__dirname)); // serves index.html, styles.css, script.js, admin.html

// ---- Analytics storage (simple JSON file) ----
function loadAnalytics() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (e) {}
  return { events: [] };
}

function saveAnalytics(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Failed to save analytics', e);
  }
}

// ---- Public endpoint to receive analytics ----
app.post('/api/analytics', (req, res) => {
  const event = req.body;
  if (!event || !event.event) {
    return res.status(400).json({ error: 'Invalid event' });
  }
  const data = loadAnalytics();
  data.events.push({
    ...event,
    receivedAt: new Date().toISOString(),
    ip: req.ip, // consider hashing for privacy
  });
  // Keep only last 1000 events
  if (data.events.length > 1000) {
    data.events = data.events.slice(-1000);
  }
  saveAnalytics(data);
  res.status(204).end();
});

// ---- Protected admin routes (Basic Auth) ----
const authMiddleware = basicAuth({
  users: { [ADMIN_USER]: ADMIN_PASS },
  challenge: true,
  realm: 'Admin Area',
});

app.get('/admin', authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/logout', (req, res) => {
  res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
  res.status(401).send('Logged out. <a href="/admin">Login again</a>');
});

// ---- Protected analytics summary for dashboard ----
app.get('/api/analytics/summary', authMiddleware, (req, res) => {
  const data = loadAnalytics();
  const events = data.events || [];

  const totalPageViews = events.filter(e => e.event === 'page_view').length;
  const totalAudioPlays = events.filter(e => e.event === 'audio_play').length;

  // Unique visitors by IP (hashed in real production)
  const ips = new Set(events.map(e => e.ip).filter(Boolean));
  const uniqueVisitors = ips.size;

  const recentEvents = events.slice(-20).reverse();

  const lastEvent = events.length ? events[events.length - 1] : null;
  const lastEventTime = lastEvent ? lastEvent.receivedAt : null;

  res.json({
    totalPageViews,
    totalAudioPlays,
    uniqueVisitors,
    lastEventTime,
    recentEvents: recentEvents.map(e => ({
      event: e.event,
      path: e.path,
      timestamp: e.timestamp || e.receivedAt,
    })),
  });
});

// ---- Start ----
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Admin dashboard at http://localhost:${PORT}/admin`);
  console.log(`Use credentials: ${ADMIN_USER} / ${ADMIN_PASS}`);
});
