import express from "express";
import path from "path";
import http from "http";
import https from "https";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Handle preflight OPTIONS requests for stream proxy
  app.options("/api/stream", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS, HEAD");
    res.status(204).end();
  });

  // Stream Proxy endpoint for insecure streams (allows HTTP to bypass HTTPS mixed-content blocks)
  app.get("/api/stream", (req, res) => {
    const urlParam = req.query.url as string;
    if (!urlParam) {
      return res.status(400).send("Parameter 'url' is required");
    }

    let activeProxyReq: http.ClientRequest | null = null;

    const performProxyRequest = (urlStr: string, depth: number) => {
      if (depth > 5) {
        return res.status(502).send("Too many redirects");
      }

      try {
        const targetUrl = new URL(urlStr);
        const clientModule = targetUrl.protocol === "https:" ? https : http;

        // Clean request options without requesting interleaved metadata blocks (no Icy-MetaData: 1)
        const options = {
          method: "GET",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "*/*"
          }
        };

        const proxyReq = clientModule.request(targetUrl.toString(), options, (proxyRes) => {
          // Detect Icecast or direct redirection
          if ([301, 302, 303, 307, 308].includes(proxyRes.statusCode || 0)) {
            const redirectLocation = proxyRes.headers.location;
            if (redirectLocation) {
              const absoluteLocation = new URL(redirectLocation, targetUrl.toString()).toString();
              console.log(`Stream Proxy redirecting client to: ${absoluteLocation}`);
              performProxyRequest(absoluteLocation, depth + 1);
              return;
            }
          }

          console.log(`Stream Proxy connected to source stream [${proxyRes.statusCode}]: ${urlStr}`);

          // Set standard HTTP and CORS headers for real-time audio streams
          const sourceContentType = proxyRes.headers["content-type"];
          res.setHeader("Content-Type", sourceContentType || "audio/mpeg");
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
          res.setHeader("Connection", "keep-alive");
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Headers", "*");
          res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS, HEAD");

          // Keep-Alive for continuous Icecast stream listening
          res.setHeader("X-Content-Type-Options", "nosniff");

          // Forward useful standard metadata/info headers if present
          for (const [key, value] of Object.entries(proxyRes.headers)) {
            if (key.startsWith("icy-") || key === "server") {
              if (value) res.setHeader(key, value);
            }
          }

          res.writeHead(proxyRes.statusCode || 200);
          proxyRes.pipe(res);
        });

        activeProxyReq = proxyReq;

        proxyReq.on("error", (err) => {
          console.error("Proxy streaming connection failed:", err.message);
          if (!res.headersSent) {
            res.status(502).send("Unable to stream audio from source receiver");
          }
        });

        proxyReq.end();

      } catch (error: any) {
        console.error("Failed to parse URL for streaming bypass:", urlStr, error.message);
        if (!res.headersSent) {
          res.status(400).send("Invalid target stream stream url requested");
        }
      }
    };

    // Begin proxy request
    performProxyRequest(urlParam, 0);

    // Cleanup stream immediately when user stops playback or closes page
    req.on("close", () => {
      console.log("Closing backend streaming proxy channel due to client disconnect.");
      if (activeProxyReq) {
        activeProxyReq.destroy();
      }
    });
  });

  // Vite dev environment rendering proxy or production static express runner
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Full-stack server listening successfully on http://0.0.0.0:${PORT}`);
  });
}

startServer();
