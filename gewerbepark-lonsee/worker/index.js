/**
 * Cloudflare Worker: liefert die statische Website aus und beantwortet POST /api/kontakt.
 * Die Formular-Logik liegt in functions/api/kontakt.js (funktioniert so auch mit Cloudflare Pages).
 */
import { onRequestPost } from "../functions/api/kontakt.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/kontakt") {
      if (request.method === "POST") return onRequestPost({ request, env });
      return new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });
    }
    return env.ASSETS.fetch(request);
  },
};
