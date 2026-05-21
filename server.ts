import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { app as apiApp } from "./src/server-app";

async function startServer() {
  const PORT = parseInt(process.env.PORT || "3000");

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    apiApp.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    apiApp.use(express.static(distPath));
    apiApp.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  apiApp.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Running and listening on http://localhost:${PORT}`);
  });
}

startServer();
