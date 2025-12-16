import { SkoolPagePayload } from "../fetcher";
import { getPageProps } from "./utils";

export type RawModule = Record<string, unknown>;

const ARRAY_KEYS = ["classroom", "modules", "courses", "items", "data"];
const COURSE_KEYS = ["course", "classroom"];
const COURSE_ARRAY_KEYS = ["modules", "lessons", "items"];

export function extractClassroomModules(payload: SkoolPagePayload): RawModule[] {
  const modules: RawModule[] = [];
  const { nextData, ldJson } = payload;

  if (nextData && typeof nextData === "object") {
    const pageProps = getPageProps(nextData);
    if (pageProps) {
      for (const key of ARRAY_KEYS) {
        const value = pageProps[key];
        if (Array.isArray(value)) {
          modules.push(
            ...value.filter((item): item is RawModule => typeof item === "object" && !!item)
          );
        }
      }

      for (const key of COURSE_KEYS) {
        const course = pageProps[key];
        if (course && typeof course === "object") {
          for (const nested of COURSE_ARRAY_KEYS) {
            const arr = (course as Record<string, unknown>)[nested];
            if (Array.isArray(arr)) {
              modules.push(
                ...arr.filter((item): item is RawModule => typeof item === "object" && !!item)
              );
            }
          }
        }
      }
    }
  }

  // Fallback to ld+json schema blocks
  for (const block of ldJson) {
    if (!block) continue;
    if (Array.isArray(block)) {
      for (const item of block) {
        if (isCourseSchema(item)) {
          modules.push(item);
        }
      }
    } else if (isCourseSchema(block)) {
      modules.push(block);
    }
  }

  return modules;
}

const COURSE_TYPES = new Set(["Course", "CreativeWork", "LearningResource"]);

function isCourseSchema(value: unknown): value is RawModule {
  if (!value || typeof value !== "object") return false;
  const type = (value as Record<string, unknown>)["@type"];
  return typeof type === "string" && COURSE_TYPES.has(type);
}
