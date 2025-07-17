import { createServer as createViteServer } from "vite";
import type { Express } from "express";
import type { Server } from "http";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import express from "express";

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function setupVite(app: Express, server: Server) {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
    root: join(__dirname, "..", "client"),
  });

  app.use(vite.ssrFixStacktrace);
  app.use(vite.middlewares);
}

export function serveStatic(app: Express) {
  const distPath = join(__dirname, "..", "dist", "public");
  app.use(express.static(distPath));
  
  app.get("*", (req, res) => {
    res.sendFile(join(distPath, "index.html"));
  });
}