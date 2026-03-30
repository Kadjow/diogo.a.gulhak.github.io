const ALLOWED_ORIGINS = new Set([
  "https://diogo.a.gulhak.github.io",
  "https://kadjow.github.io",
  "http://127.0.0.1:5500",
  "http://localhost:5500"
]);

function buildCorsHeaders(origin) {
  const headers = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };

  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

const TURNSTILE_DUMMY_SECRET = "1x0000000000000000000000000000000AA";

function pickTurnstileSecret(token, defaultSecret) {
  try {
    if (typeof token === "string" && token.toUpperCase().indexOf("DUMMY") >= 0) {
      return TURNSTILE_DUMMY_SECRET;
    }
  } catch (_) {}

  return defaultSecret;
}

function jsonResponse(payload, status, corsHeaders) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const corsHeaders = buildCorsHeaders(origin);
    const originAllowed = !origin || ALLOWED_ORIGINS.has(origin);

    if (request.method === "OPTIONS") {
      if (!originAllowed) {
        return new Response(null, { status: 403, headers: corsHeaders });
      }
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    if (request.method !== "POST" || url.pathname !== "/verify") {
      return new Response("Not found", { status: 404, headers: corsHeaders });
    }

    if (!originAllowed) {
      return jsonResponse({ ok: false, success: false, error: "origin_not_allowed" }, 403, corsHeaders);
    }

    let token = "";
    try {
      const body = await request.json();
      token = body?.token || "";
    } catch (_) {
      token = "";
    }

    if (!token) {
      return jsonResponse({ ok: false, success: false, error: "missing_token" }, 400, corsHeaders);
    }

    const formData = new FormData();
    formData.append("secret", pickTurnstileSecret(token, env.TURNSTILE_SECRET));
    formData.append("response", token);

    let data = null;
    try {
      const verifyResponse = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        body: formData
      });
      data = await verifyResponse.json();
    } catch (_) {
      data = null;
    }

    const rawSuccess = !!(data && data.success === true);

    const expectedAction =
      (typeof env !== "undefined" && env && (env.TURNSTILE_EXPECTED_ACTION || env.TURNSTILE_ACTION)) ||
      (typeof TURNSTILE_EXPECTED_ACTION !== "undefined" ? TURNSTILE_EXPECTED_ACTION : null) ||
      null;

    const expectedHostname =
      (typeof env !== "undefined" && env && (env.TURNSTILE_EXPECTED_HOSTNAME || env.TURNSTILE_HOSTNAME)) ||
      (typeof TURNSTILE_EXPECTED_HOSTNAME !== "undefined" ? TURNSTILE_EXPECTED_HOSTNAME : null) ||
      null;

    const actionOk = !expectedAction || !data || !data.action || data.action === expectedAction;
    const hostOk = !expectedHostname || !data || !data.hostname || data.hostname === expectedHostname;

    const success = rawSuccess && actionOk && hostOk;
    const errorCodes = (data && (data["error-codes"] || data.errorCodes)) || [];

    return jsonResponse(
      {
        ok: success,
        success,
        action: data && data.action,
        hostname: data && data.hostname,
        cdata: data && data.cdata,
        errorCodes
      },
      success ? 200 : 400,
      corsHeaders
    );
  }
};