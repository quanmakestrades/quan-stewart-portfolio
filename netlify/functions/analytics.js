import { getStore } from "@netlify/blobs";

function analyticsStore() {
  return getStore({
    name: "portfolio-analytics",
    siteID: process.env.NETLIFY_SITE_ID || process.env.SITE_ID,
    token: process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_AUTH_TOKEN,
  });
}
const allowedTypes = new Set(["pageview", "click", "case_open", "client_error", "resource_error", "vital"]);

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
    body: JSON.stringify(body),
  };
}

function cleanString(value, max = 240) {
  return String(value || "")
    .replace(/[^\x20-\x7E]/g, "")
    .slice(0, max);
}

function cleanEvent(payload, event) {
  const now = new Date();
  const type = allowedTypes.has(payload.type) ? payload.type : "pageview";
  const data = payload.data && typeof payload.data === "object" ? payload.data : {};
  const headers = event.headers || {};

  return {
    id: `${now.toISOString()}-${Math.random().toString(36).slice(2, 10)}`,
    ts: now.toISOString(),
    type,
    path: cleanString(data.path || payload.path || "/", 220),
    title: cleanString(data.title, 120),
    referrer: cleanString(data.referrer, 260),
    target: cleanString(data.target, 180),
    label: cleanString(data.label, 180),
    message: cleanString(data.message, 400),
    source: cleanString(data.source, 220),
    line: Number.isFinite(Number(data.line)) ? Number(data.line) : null,
    column: Number.isFinite(Number(data.column)) ? Number(data.column) : null,
    viewport: {
      width: Number.isFinite(Number(data.viewport?.width)) ? Number(data.viewport.width) : null,
      height: Number.isFinite(Number(data.viewport?.height)) ? Number(data.viewport.height) : null,
    },
    connection: cleanString(data.connection, 60),
    userAgent: cleanString(headers["user-agent"], 280),
    country: cleanString(headers["x-nf-geo"] || headers["x-country"] || "", 80),
  };
}

function dayKey(ts) {
  return ts.slice(0, 10);
}

async function listEvents(limit = 500) {
  const store = analyticsStore();
  const listed = await store.list({ prefix: "events/" });
  const keys = listed.blobs
    .map((blob) => blob.key)
    .sort()
    .slice(-Math.max(1, Math.min(limit, 2000)));

  const events = [];
  for (const key of keys) {
    const item = await store.get(key, { type: "json" });
    if (item) events.push(item);
  }
  return events.sort((a, b) => String(b.ts).localeCompare(String(a.ts)));
}

function summarize(events) {
  const byType = {};
  const byPath = {};
  const byDay = {};
  const errors = [];
  const clicks = [];

  for (const event of events) {
    byType[event.type] = (byType[event.type] || 0) + 1;
    byPath[event.path] = (byPath[event.path] || 0) + 1;
    byDay[dayKey(event.ts)] = (byDay[dayKey(event.ts)] || 0) + 1;
    if (event.type.includes("error")) errors.push(event);
    if (event.type === "click" || event.type === "case_open") clicks.push(event);
  }

  return {
    total: events.length,
    byType,
    byPath: Object.entries(byPath)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([path, count]) => ({ path, count })),
    byDay,
    recentErrors: errors.slice(0, 25),
    recentClicks: clicks.slice(0, 25),
  };
}

export async function handler(event) {
  if (event.httpMethod === "POST") {
    let payload = {};
    try {
      payload = JSON.parse(event.body || "{}");
    } catch {
      return json(400, { ok: false, error: "invalid_json" });
    }

    const item = cleanEvent(payload, event);
    const store = analyticsStore();
    await store.setJSON(`events/${item.ts}-${item.id}.json`, item);
    return json(200, { ok: true });
  }

  if (event.httpMethod === "GET") {
    const limit = Number(event.queryStringParameters?.limit || 500);
    const events = await listEvents(limit);
    return json(200, {
      ok: true,
      generatedAt: new Date().toISOString(),
      summary: summarize(events),
      events: events.slice(0, 250),
    });
  }

  return json(405, { ok: false, error: "method_not_allowed" });
}
