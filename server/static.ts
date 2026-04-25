import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // The polished BB Unified App mockup is the live home page.
  // Static assets (manifest, icons, etc.) and /api routes still work normally.
  // The mockup is self-contained (uses localStorage); to swap back to the
  // React app, point these handlers at "index.html" instead.
  const mockupFile = path.resolve(distPath, "BB_UnifiedApp_Mockup.html");
  const fallbackFile = fs.existsSync(mockupFile)
    ? mockupFile
    : path.resolve(distPath, "index.html");

  app.get("/", (_req, res) => {
    res.sendFile(fallbackFile);
  });

  app.use(express.static(distPath));

  // SPA fall-through — anything not matched by static assets returns the mockup.
  app.use("/{*path}", (_req, res) => {
    res.sendFile(fallbackFile);
  });
}
