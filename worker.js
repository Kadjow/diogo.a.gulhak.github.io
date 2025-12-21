const ALLOWED_ORIGINS = new Set([
  "https://kadjow.github.io",
  "http://localhost:5500",
  "http://127.0.0.1:5500"
]);

const buildCorsHeaders = (origin) => {
  const headers = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin"
  };

  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "null";
  headers["Access-Control-Allow-Origin"] = allowOrigin;
  return headers;
};

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const originAllowed = ALLOWED_ORIGINS.has(origin);
    const corsHeaders = buildCorsHeaders(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders, status: 204 });
    }

    const url = new URL(request.url);
    if (request.method !== "POST" || url.pathname !== "/verify") {
      return new Response("Not found", { status: 404, headers: corsHeaders });
    }

    let token = "";
    try {
      const body = await request.json();
      token = body?.token || "";
    } catch (_) {
      token = "";
    }

    if (!token) {
      return new Response(JSON.stringify({ success: false }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const formData = new FormData();
    formData.append("secret", env.TURNSTILE_SECRET);
    formData.append("response", token);

    if (!originAllowed) {
      return new Response(JSON.stringify({ success: false }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

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

    const success = !!data?.success;
    return new Response(JSON.stringify({ success }), {
      status: success ? 200 : 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
};
