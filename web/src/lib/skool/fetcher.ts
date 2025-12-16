import { chromium } from "playwright";

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/122.0.0.0 Safari/537.36";

const DEFAULT_TIMEOUT = 30_000;

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

export async function loadSkoolPage(
  url: string,
  options: LoadOptions = {}
): Promise<SkoolPagePayload> {
  const {
    userAgent = DEFAULT_USER_AGENT,
    waitFor = 2000,
    retries = 3,
    waitUntil = "domcontentloaded",
    timeout = DEFAULT_TIMEOUT,
  } = options;

  let attempt = 0;
  while (attempt < retries) {
    attempt += 1;
    const browser = await chromium.launch();
    const context = await browser.newContext({ userAgent });
    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil, timeout });
      if (waitFor > 0) {
        await page.waitForTimeout(waitFor);
      }
      const html = await page.content();
      const nextData = await page.evaluate("window.__NEXT_DATA__");
      const ldJson = await page.evaluate(() => {
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
      });

      return {
        html,
        nextData,
        ldJson,
      };
    } catch (error) {
      if (attempt >= retries) {
        throw error;
      }
      await page.waitForTimeout(500 * attempt);
    } finally {
      await browser.close();
    }
  }

  throw new Error(`Unable to load Skool page: ${url}`);
}
