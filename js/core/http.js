export async function postJSON(url, body, { timeoutMs = 8000 } = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    const text = await response.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (_error) {
        data = null;
      }
    }
    return { ok: response.ok, status: response.status, data };
  } catch (_error) {
    return { ok: false, status: null, data: null };
  } finally {
    clearTimeout(timeout);
  }
}
