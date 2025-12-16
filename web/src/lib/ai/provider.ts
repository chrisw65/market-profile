const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL;
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "llama3";

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

export async function generateCampaignIdeas(input: CampaignInput): Promise<string> {
  const prompt = buildPrompt(input);

  if (!OLLAMA_BASE_URL) {
    return fallbackSummary(input);
  }

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
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Ollama request failed: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const result = typeof data?.response === "string" ? data.response : "";
  return result || fallbackSummary(input);
}

function buildPrompt(input: CampaignInput): string {
  return [
    "You are an AI marketing strategist.",
    "Generate a concise campaign plan with:",
    "- 2 positioning angles",
    "- 3 ad hook ideas",
    "- Audience notes",
    "- CTA recommendations.",
    "",
    `Community slug: ${input.slug}`,
    `Hero statement: ${input.hero}`,
    `Experience highlights: ${input.valueStack.experience.join("; ")}`,
    `Community actions: ${input.valueStack.next_steps.join("; ")}`,
    `Keywords: ${input.keywords.join(", ")}`,
    `Classroom modules: ${input.classroomTitles.join("; ")}`,
    `Post hooks: ${input.postHooks.join("; ")}`,
  ].join("\n");
}

function fallbackSummary(input: CampaignInput): string {
  return [
    `Campaign focus for ${input.slug}:`,
    `- Lead with "${input.hero.slice(0, 120)}"`,
    `- Classroom priorities: ${input.classroomTitles.slice(0, 3).join(", ") || "Add more modules to spotlight journey."}`,
    `- Use hooks: ${input.postHooks.slice(0, 3).join(", ") || "Showcase member wins and before/after transformations."}`,
    `- CTA ideas: ${input.valueStack.next_steps.slice(0, 3).join(", ") || "Invite members to join weekly live training, post wins, schedule onboarding call."}`,
  ].join("\n");
}
