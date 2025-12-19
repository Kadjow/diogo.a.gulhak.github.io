const corsHeaders = {
  "Access-Control-Allow-Origin": "https://kadjow.github.io",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    if (request.method !== "POST" || url.pathname !== "/verify") {
      return new Response("Not found", { status: 404 });
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
