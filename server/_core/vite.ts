import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";
import { brandName, brandDomain } from "../brand";

const FAVICON_DEFAULT = `<link rel="icon" type="image/svg+xml" href="/favicon.svg?v=3" />
    <link rel="apple-touch-icon" href="/favicon.svg?v=3" />`;

const FAVICON_FASTDOC = `<link rel="icon" type="image/svg+xml" href="/favicon-fastdoc.svg" />`;

const faviconLinks = brandName === "FastDoc" ? FAVICON_FASTDOC : FAVICON_DEFAULT;

const trackingScripts = "";

const isFastDoc = brandName === "FastDoc";
const pageTitle = isFastDoc
  ? `PDF en el navegador – editar, firmar y convertir | ${brandName}`
  : `Editar PDF en el navegador – firmar y convertir | ${brandName}`;
const pageDescription = isFastDoc
  ? "Retoca un PDF en el navegador: texto, firma, imágenes y conversión a Word o JPG."
  : "Abre el PDF en el navegador, corrige el texto, firma, convierte a Word o Excel y descarga la copia.";
const pageKeywords = isFastDoc
  ? "editar PDF, firmar PDF, PDF a Word, unir PDF, comprimir PDF"
  : "editar PDF en el navegador, firmar PDF, PDF a Word, unir PDF, comprimir PDF";

function replaceBrandPlaceholders(html: string): string {
  let result = html
    .replaceAll("%%BRAND_NAME%%", brandName)
    .replaceAll("%%BRAND_DOMAIN%%", brandDomain)
    .replaceAll("%%FAVICON_LINKS%%", faviconLinks)
    .replaceAll("%%TRACKING_SCRIPTS%%", trackingScripts)
    .replaceAll("%%PAGE_TITLE%%", pageTitle)
    .replaceAll("%%PAGE_DESCRIPTION%%", pageDescription)
    .replaceAll("%%PAGE_KEYWORDS%%", pageKeywords);
  // Safety net: remove any remaining %%PLACEHOLDER%% that we missed
  result = result.replace(/%%[A-Z_]+%%/g, "");
  return result;
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(replaceBrandPlaceholders(page));
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  const indexPath = path.resolve(distPath, "index.html");
  // Cache the processed index.html so we don't read+replace on every request
  let processedIndex: string | null = null;
  function getProcessedIndex(): string {
    if (!processedIndex) {
      const raw = fs.readFileSync(indexPath, "utf-8");
      processedIndex = replaceBrandPlaceholders(raw);
    }
    return processedIndex;
  }

  // Serve static assets but SKIP index.html (we process it with brand placeholders)
  app.use(express.static(distPath, { index: false }));

  // All routes → processed index.html (SPA fallback)
  app.use("*", (_req, res) => {
    res.status(200).set({
      "Content-Type": "text/html",
      // CRITICAL: never let the browser cache the HTML shell. Without this the
      // browser heuristically caches index.html and keeps loading the OLD hashed
      // JS bundles after a deploy — which made every fix seem "intermittent" /
      // stuck (users on a cached shell ran old code). The hashed assets stay
      // immutable-cached; only this HTML must always revalidate.
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    }).end(getProcessedIndex());
  });
}
