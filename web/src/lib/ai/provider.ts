/**
 * AI provider for generating campaign ideas
 * Supports Ollama (local) with fallback to structured summaries
 */

interface CampaignInput {
  slug: string;
  hero: string;
  valueStack: {
    experience: string[];
    next_steps: string[];
  };
  keywords: string[];
  classroomTitles: string[];
  postHooks: string[];
}

interface GenerateOptions {
  timeout?: number;
  retries?: number;
}

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_RETRIES = 2;

/**
 * Generate campaign ideas using AI or fallback to structured summary
 */
export async function generateCampaignIdeas(
  input: CampaignInput,
  options: GenerateOptions = {}
): Promise<string> {
  const { timeout = DEFAULT_TIMEOUT, retries = DEFAULT_RETRIES } = options;
  const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL;
  const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "llama3";

  if (!OLLAMA_BASE_URL) {
    console.warn("[AI] OLLAMA_BASE_URL not configured, using fallback summary");
    return fallbackSummary(input);
  }

  const prompt = buildPrompt(input);

  // Attempt with retries
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          prompt,
          stream: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text().catch(() => "Unknown error");
        throw new Error(`Ollama request failed: ${response.status} ${errText}`);
      }

      const data = await response.json();
      const result = typeof data?.response === "string" ? data.response.trim() : "";

      if (!result) {
        throw new Error("Empty response from Ollama");
      }

      return result;
    } catch (error) {
      const isLastAttempt = attempt === retries;

      if (error instanceof Error && error.name === "AbortError") {
        console.error(`[AI] Request timeout on attempt ${attempt}/${retries}`);
      } else {
        console.error(`[AI] Generation failed on attempt ${attempt}/${retries}:`, error);
      }

      if (isLastAttempt) {
        console.warn("[AI] All attempts failed, using fallback summary");
        return fallbackSummary(input);
      }

      // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }

  // Should never reach here, but TypeScript needs it
  return fallbackSummary(input);
}

/**
 * Build the prompt for AI generation
 */
function buildPrompt(input: CampaignInput): string {
  return [
    "You are an AI marketing strategist specializing in online community growth.",
    "Analyze the following community data and generate a comprehensive marketing campaign plan.",
    "",
    "## Community Data",
    `- Community: ${input.slug}`,
    `- Hero Statement: ${input.hero}`,
    `- Value Proposition: ${input.valueStack.experience.join("; ")}`,
    `- Member Actions: ${input.valueStack.next_steps.join("; ")}`,
    `- Keywords: ${input.keywords.join(", ")}`,
    `- Course Modules: ${input.classroomTitles.join("; ")}`,
    `- Engagement Hooks: ${input.postHooks.join("; ")}`,
    "",
    "## Required Output",
    "Generate a marketing campaign plan with:",
    "1. **Positioning Angles** (2-3 unique positioning strategies)",
    "2. **Ad Hooks** (3-5 compelling hooks for ads)",
    "3. **Target Audience** (detailed audience profile)",
    "4. **Call-to-Actions** (specific CTAs for different channels)",
    "5. **Content Strategy** (key themes and topics)",
    "",
    "Use markdown formatting with clear sections.",
  ].join("\n");
}

/**
 * Fallback summary when AI is unavailable
 */
function fallbackSummary(input: CampaignInput): string {
  const sections: string[] = [];

  sections.push(`# Campaign Strategy for ${input.slug}`);
  sections.push("");

  // Hero section
  if (input.hero) {
    sections.push("## Positioning");
    sections.push(`**Core Message:** ${input.hero.slice(0, 200)}${input.hero.length > 200 ? "..." : ""}`);
    sections.push("");
  }

  // Value stack
  if (input.valueStack.experience.length > 0) {
    sections.push("## Value Highlights");
    input.valueStack.experience.slice(0, 5).forEach((exp) => {
      sections.push(`- ${exp}`);
    });
    sections.push("");
  }

  // Classroom modules
  if (input.classroomTitles.length > 0) {
    sections.push("## Course Content");
    sections.push("Featured modules:");
    input.classroomTitles.slice(0, 5).forEach((title) => {
      sections.push(`- ${title}`);
    });
    sections.push("");
  }

  // Post hooks
  if (input.postHooks.length > 0) {
    sections.push("## Content Hooks");
    input.postHooks.slice(0, 5).forEach((hook) => {
      sections.push(`- ${hook}`);
    });
    sections.push("");
  }

  // Call to actions
  if (input.valueStack.next_steps.length > 0) {
    sections.push("## Call-to-Actions");
    input.valueStack.next_steps.slice(0, 5).forEach((cta) => {
      sections.push(`- ${cta}`);
    });
    sections.push("");
  }

  // Keywords
  if (input.keywords.length > 0) {
    sections.push("## Target Keywords");
    sections.push(input.keywords.slice(0, 10).join(", "));
    sections.push("");
  }

  sections.push("---");
  sections.push("*Note: AI generation unavailable. This is a structured summary of community data.*");

  return sections.join("\n");
}
