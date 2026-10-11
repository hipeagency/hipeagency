/** Render brand social cards with exact supplied assets and local typography.
 * Requires Playwright; PLAYWRIGHT_MODULE_PATH can point to an existing installation.
 * CHROME_PATH optionally selects a browser executable instead of bundled Chromium.
 */
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE_PATH || "playwright",
);
const path = require("node:path");
const fs = require("node:fs");
const { pathToFileURL } = require("node:url");
const root = path.resolve(__dirname, "..");
const asset = (relative) => pathToFileURL(path.join(root, relative)).href;
const cards = [
  [
    "home",
    "BRANDS<br>MADE TO<br>PERFORM",
    "BRANDING · COMMUNICATION · DIGITAL",
    "HIGH PERFORMANCE FOR BRANDS",
  ],
  [
    "work",
    "PERFORMANCE,<br>IN PRACTICE",
    "BRAND · COMMUNICATION · DIGITAL · CONTENT",
    "SELECTED WORK",
  ],
  [
    "agency",
    "HIGH<br>PERFORMANCE<br>AGENCY",
    "STRATEGY. CREATIVITY. EXECUTION.",
    "THIS IS HIPE",
  ],
  [
    "contact",
    "LET’S MAKE<br>IT PERFORM",
    "maxim@HIPEAGENCY.ES",
    "START A PROJECT",
  ],
];
(async () => {
  const macChrome =
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  const executablePath =
    process.env.CHROME_PATH ||
    (fs.existsSync(macChrome) ? macChrome : undefined);
  const browser = await chromium.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1200, height: 630 },
      deviceScaleFactor: 1,
    });
    for (const [key, headline, disciplines, label] of cards) {
      await page.goto(asset("index.html"));
      await page.setContent(`<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
        @font-face{font-family:Clash;src:url('${asset("fonts/ClashDisplay-Medium.otf")}');font-weight:500}
        *{box-sizing:border-box}body{margin:0;width:1200px;height:630px;background:#f7f6f2;color:#111;font-family:Arial,sans-serif;padding:48px 60px;overflow:hidden}
        header{display:flex;align-items:center;gap:26px;height:64px}header img{width:170px;height:auto}header span{font-size:12px;letter-spacing:.09em;line-height:1.5;padding-left:24px;border-left:1px solid #bbb}
        .label{font-size:11px;letter-spacing:.14em;margin-top:38px;font-weight:600}
        h1{font-family:Clash,Arial,sans-serif;font-size:${key === "work" ? 85 : key === "agency" ? 96 : 105}px;font-weight:500;line-height:.93;letter-spacing:-.05em;margin:28px 0 0;max-width:840px}
        .stop{display:inline-block;background:#c8102e;width:.16em;height:.16em;margin-left:.03em}
        .symbol{position:absolute;right:60px;top:235px;width:220px;height:220px;object-fit:contain}
        footer{position:absolute;bottom:38px;left:60px;right:60px;border-top:1px solid #ccc;padding-top:19px;display:flex;justify-content:space-between;font-size:10px;letter-spacing:.13em}
      </style></head><body><header><img src="${asset("assets/brand/hipe-black.png")}" alt="HIPE"><span>HIGH PERFORMANCE<br>AGENCY</span></header><div class="label">${label}</div><h1>${headline}<span class="stop"></span></h1><img class="symbol" src="${asset("assets/brand/symbol-red.png")}" alt=""><footer><span>${disciplines}</span><span>HIPEAGENCY.ES</span></footer></body></html>`);
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all([...document.images].map((img) => img.decode()));
      });
      await page.screenshot({
        path: path.join(root, "assets/social", `og-${key}.jpg`),
        type: "jpeg",
        quality: 92,
      });
      console.log(`Created assets/social/og-${key}.jpg (1200 × 630)`);
    }
  } finally {
    await browser.close();
  }
})();
