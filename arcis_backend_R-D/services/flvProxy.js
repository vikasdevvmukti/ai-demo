// services/flvProxy.js
// WSS-FLV proxy for Monibuca servers.
//
// Problem: Monibuca's global.http.username/password protects the WHOLE
// http layer, including WSS-FLV playback endpoints. If the frontend
// connects directly to Monibuca with credentials in the URL, those
// credentials are visible in the browser's Network tab.
//
// Fix: Frontend connects to THIS backend proxy (no credentials visible).
// This proxy then opens a server-side WebSocket connection to the real
// Monibuca server, attaching the Basic Auth header itself, and pipes
// data both ways. The password never reaches the browser.
//
// Frontend URL format:
//   wss://<backend-host>/api/stream/proxy-flv/<mediaUrl>/<rest-of-path>
//
// Example:
//   wss://vmsai2026.vmukti.com:5000/api/stream/proxy-flv/media1.example.com/jessica/live-record/CAM001.flv
//     -> proxies to ->
//   ws://media1.example.com/jessica/live-record/CAM001.flv
//     with header: Authorization: Basic base64(username:password)

const WebSocket = require('ws');
const { URL } = require('url');
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const PROXY_PREFIX = '/api/stream/proxy-flv/';

// All 50 Monibuca servers share the same credentials (per user confirmation).
// Stored once here via .env — never touches the client.
const MONIBUCA_USERNAME = process.env.MONIBUCA_USERNAME || 'root';
const MONIBUCA_PASSWORD = process.env.MONIBUCA_PASSWORD || '';

function initFlvProxy(server) {
  const wss = new WebSocket.Server({ noServer: true });

  server.on('upgrade', async (request, socket, head) => {
    let pathname;
    try {
      pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
    } catch (e) {
      // Malformed URL — not our concern, let other upgrade handlers see it too.
      return;
    }

    // Only handle our own path. Let other upgrade handlers (e.g. /ws/talk
    // from twoWayTalk.js) deal with everything else — do NOT destroy the
    // socket here, since multiple 'upgrade' listeners can coexist on the
    // same HTTP server as long as each one ignores paths it doesn't own.
    if (!pathname.startsWith(PROXY_PREFIX)) {
      return;
    }
    // ---------------- Authentication ----------------

try {

    const cookies = cookie.parse(request.headers.cookie || "");

    const token = cookies.token;

    if (!token) {
        socket.write(
            "HTTP/1.1 401 Unauthorized\r\n" +
            "Connection: close\r\n\r\n"
        );
        socket.destroy();
        return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
        socket.write(
            "HTTP/1.1 401 Unauthorized\r\n" +
            "Connection: close\r\n\r\n"
        );
        socket.destroy();
        return;
    }

    const valid = user.tokens.some(t => t.token === token);

    if (!valid) {
        socket.write(
            "HTTP/1.1 401 Unauthorized\r\n" +
            "Connection: close\r\n\r\n"
        );
        socket.destroy();
        return;
    }

    request.user = user;

} catch (err) {

    console.log("FLV Auth Failed:", err.message);

    socket.write(
        "HTTP/1.1 401 Unauthorized\r\n" +
        "Connection: close\r\n\r\n"
    );

    socket.destroy();
    return;
} 

    if (!MONIBUCA_PASSWORD) {
      console.error('[FLV Proxy] MONIBUCA_PASSWORD not set in environment — rejecting upgrade');
      socket.write(
        'HTTP/1.1 500 Internal Server Error\r\n' +
        'Content-Type: text/plain\r\n' +
        'Connection: close\r\n\r\n' +
        'FLV proxy misconfigured'
      );
      socket.destroy();
      return;
    }

    // Parse: /api/stream/proxy-flv/<targetHost>/<targetPath...>
    const remainder = pathname.slice(PROXY_PREFIX.length); // "<targetHost>/<targetPath...>"
    const firstSlash = remainder.indexOf('/');

    if (firstSlash === -1 || firstSlash === 0) {
      console.warn('[FLV Proxy] Malformed proxy path:', pathname);
      socket.write(
        'HTTP/1.1 400 Bad Request\r\n' +
        'Content-Type: text/plain\r\n' +
        'Connection: close\r\n\r\n' +
        'Malformed proxy path'
      );
      socket.destroy();
      return;
    }

    const targetHost = remainder.substring(0, firstSlash);   // e.g. media1.example.com or media1.example.com:8080
    const targetPath = remainder.substring(firstSlash);      // e.g. /jessica/live-record/CAM001.flv

    const authHeader =
      'Basic ' + Buffer.from(`${MONIBUCA_USERNAME}:${MONIBUCA_PASSWORD}`).toString('base64');
    
    // Protocol detection: Default to wss:// for production domains
    // Use ws:// only for explicit local/non-TLS ports (localhost, 127.0.0.1, or :80/:8080/:8000)
    const isLocalhost = targetHost.includes('localhost') || targetHost.includes('127.0.0.1');
    const hasExplicitNonTlsPort = targetHost.includes(':80') || targetHost.includes(':8080') || targetHost.includes(':8000');
    const protocol = (isLocalhost && !targetHost.includes(':443')) || hasExplicitNonTlsPort ? 'ws' : 'wss';
    const targetUrl = `${protocol}://${targetHost}${targetPath}`;

    console.log('[FLV Proxy] Proxying to:', targetUrl);

    const upstreamWs = new WebSocket(targetUrl, {
      headers: { Authorization: authHeader },
    });

    let settled = false;

    upstreamWs.on('open', () => {
      settled = true;
      wss.handleUpgrade(request, socket, head, (clientWs) => {
        upstreamWs.on('message', (data) => {
          if (clientWs.readyState === WebSocket.OPEN) clientWs.send(data);
        });
        clientWs.on('message', (data) => {
          if (upstreamWs.readyState === WebSocket.OPEN) upstreamWs.send(data);
        });

        clientWs.on('close', () => upstreamWs.close());
        upstreamWs.on('close', () => clientWs.close());
        upstreamWs.on('error', (err) => {
          console.warn('[FLV Proxy] Upstream error after connect:', targetUrl, err.message);
          clientWs.close();
        });
        clientWs.on('error', () => upstreamWs.close());
      });
    });

    upstreamWs.on('error', (err) => {
      if (settled) return; // already handled via handleUpgrade path
      console.error('[FLV Proxy] Upstream connection failed:', targetUrl, '-', err.message);
      socket.write(
        'HTTP/1.1 502 Bad Gateway\r\n' +
        'Content-Type: text/plain\r\n' +
        'Connection: close\r\n\r\n' +
        'Could not connect to Monibuca server'
      );
      socket.destroy();
    });
  });

  console.log('[FLV Proxy] WSS-FLV proxy ready at', PROXY_PREFIX);
  return wss;
}

module.exports = { initFlvProxy };