import { chromium } from "playwright";

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/131.0.0.0 Safari/537.36";

const DEFAULT_TIMEOUT = 60_000; // Increased to 60 seconds

export interface SkoolPagePayload {
  html: string;
  nextData?: unknown;
  ldJson: unknown[];
}

type WaitUntilState = "load" | "domcontentloaded" | "networkidle" | "commit";

interface LoadOptions {
  userAgent?: string;
  waitFor?: number;
  retries?: number;
  waitUntil?: WaitUntilState;
  timeout?: number;
}

/**
 * Load a Skool page with Playwright
 * Includes anti-detection measures and retry logic
 */
export async function loadSkoolPage(
  url: string,
  options: LoadOptions = {}
): Promise<SkoolPagePayload> {
  const {
    userAgent = DEFAULT_USER_AGENT,
    waitFor = 3000,
    retries = 2,
    waitUntil = "domcontentloaded",
    timeout = DEFAULT_TIMEOUT,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    let browser = null;

    try {
      console.log(`[Skool Fetcher] Attempt ${attempt}/${retries} for ${url}`);

      browser = await chromium.launch({
        headless: true,
        args: [
          "--disable-blink-features=AutomationControlled",
          "--disable-dev-shm-usage",
          "--no-sandbox",
        ],
      });

      const context = await browser.newContext({
        userAgent,
        viewport: { width: 1920, height: 1080 },
        locale: "en-US",
        timezoneId: "America/New_York",
        // Add realistic browser features
        extraHTTPHeaders: {
          "Accept-Language": "en-US,en;q=0.9",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        },
      });

      // Remove webdriver flag
      await context.addInitScript(() => {
        Object.defineProperty(navigator, "webdriver", {
          get: () => undefined,
        });
      });

      const page = await context.newPage();

      // Navigate with timeout
      await page.goto(url, {
        waitUntil,
        timeout,
      });

      // Wait for page to stabilize
      if (waitFor > 0) {
        await page.waitForTimeout(waitFor);
      }

      // Extract data
      const html = await page.content();

      const nextData = await page
        .evaluate(() => {
          return (window as unknown as { __NEXT_DATA__?: unknown }).__NEXT_DATA__;
        })
        .catch(() => undefined);

      const ldJson = await page
        .evaluate(() => {
          const scripts = Array.from(
            document.querySelectorAll('script[type="application/ld+json"]')
          ) as HTMLScriptElement[];
          return scripts
            .map((script) => {
              try {
                return script.textContent ? JSON.parse(script.textContent) : null;
              } catch {
                return null;
              }
            })
            .filter(Boolean);
        })
        .catch(() => []);

      console.log(`[Skool Fetcher] Successfully loaded ${url}`);

      return {
        html,
        nextData,
        ldJson,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(
        `[Skool Fetcher] Attempt ${attempt}/${retries} failed:`,
        lastError.message
      );

      if (attempt < retries) {
        // Exponential backoff
        const backoffMs = 2000 * attempt;
        console.log(`[Skool Fetcher] Retrying in ${backoffMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    } finally {
      if (browser) {
        await browser.close().catch((err) => {
          console.error("[Skool Fetcher] Error closing browser:", err);
        });
      }
    }
  }

  // All retries failed
  throw lastError || new Error(`Unable to load Skool page: ${url}`);
}
