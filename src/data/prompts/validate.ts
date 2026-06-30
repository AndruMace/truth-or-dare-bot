import {
  TRUTH_CATEGORIES,
  DARE_CATEGORIES,
  loadDefaultPrompts,
} from "./manifest";

const MIN_COUNT = 450;
const TARGET_LOW = 480;
const TARGET_HIGH = 520;
const MAX_LENGTH = 400;
const NEAR_DUPE_PREFIX_LEN = 60;

const DARE_BLOCKLIST = [
  "nude",
  "nudes",
  "lingerie",
  "underwear",
  "bathroom",
  "selfie",
  "outfit",
  "bedroom",
  "browser history",
  "photo roll",
  "camera roll",
  "dm ",
  "dms ",
  "naked",
  "strip",
  "sexual act",
  "send a nude",
];

export type ValidationResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function nearDupeKey(text: string): string {
  return normalize(text).slice(0, NEAR_DUPE_PREFIX_LEN);
}

export function validatePromptBank(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const { truths, dares } = loadDefaultPrompts();

  if (truths.length < MIN_COUNT) {
    errors.push(`Truths: ${truths.length} (minimum ${MIN_COUNT})`);
  } else if (truths.length < TARGET_LOW || truths.length > TARGET_HIGH) {
    warnings.push(`Truths: ${truths.length} (target ${TARGET_LOW}–${TARGET_HIGH})`);
  }

  if (dares.length < MIN_COUNT) {
    errors.push(`Dares: ${dares.length} (minimum ${MIN_COUNT})`);
  } else if (dares.length < TARGET_LOW || dares.length > TARGET_HIGH) {
    warnings.push(`Dares: ${dares.length} (target ${TARGET_LOW}–${TARGET_HIGH})`);
  }

  for (const category of [...TRUTH_CATEGORIES, ...DARE_CATEGORIES]) {
    const label = category.file;
    if (category.prompts.length === 0) {
      errors.push(`${label}: empty category`);
    }
    console.log(`  ${label}: ${category.prompts.length}`);
  }

  const checkExactDupes = (items: string[], label: string) => {
    const seen = new Map<string, string>();
    for (const text of items) {
      if (seen.has(text)) {
        errors.push(`Exact duplicate in ${label}: "${text.slice(0, 50)}..."`);
      } else {
        seen.set(text, text);
      }
    }
  };

  for (const category of TRUTH_CATEGORIES) {
    checkExactDupes(category.prompts, category.file);
  }
  for (const category of DARE_CATEGORIES) {
    checkExactDupes(category.prompts, category.file);
  }

  checkExactDupes(truths, "all truths");
  checkExactDupes(dares, "all dares");

  const nearDupeMap = new Map<string, string>();
  for (const text of [...truths, ...dares]) {
    const key = nearDupeKey(text);
    if (!key) continue;
    const prev = nearDupeMap.get(key);
    if (prev && prev !== text) {
      warnings.push(`Near-duplicate (${NEAR_DUPE_PREFIX_LEN}-char prefix): "${prev.slice(0, 40)}..." vs "${text.slice(0, 40)}..."`);
    } else {
      nearDupeMap.set(key, text);
    }
  }

  for (const text of [...truths, ...dares]) {
    if (text.length > MAX_LENGTH) {
      warnings.push(`Long prompt (${text.length} chars): "${text.slice(0, 50)}..."`);
    }
  }

  for (const text of dares) {
    const lower = text.toLowerCase();
    for (const term of DARE_BLOCKLIST) {
      if (lower.includes(term)) {
        errors.push(`Dare blocklist hit "${term}": "${text.slice(0, 60)}..."`);
      }
    }
    const hasProofHint =
      /voice note|voice message|screenshot|photo of|record.*video|post a video/i.test(
        text,
      );
    if (!hasProofHint) {
      warnings.push(`Dare missing proof-type hint: "${text.slice(0, 60)}..."`);
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

if (import.meta.main) {
  console.log("Validating prompt bank...\nCategory counts:");
  const result = validatePromptBank();

  console.log(`\nTotals: ${loadDefaultPrompts().truths.length} truths, ${loadDefaultPrompts().dares.length} dares`);

  if (result.warnings.length > 0) {
    console.log(`\nWarnings (${result.warnings.length}):`);
    for (const w of result.warnings.slice(0, 20)) {
      console.log(`  - ${w}`);
    }
    if (result.warnings.length > 20) {
      console.log(`  ... and ${result.warnings.length - 20} more`);
    }
  }

  if (result.errors.length > 0) {
    console.error(`\nErrors (${result.errors.length}):`);
    for (const e of result.errors) {
      console.error(`  - ${e}`);
    }
    process.exit(1);
  }

  console.log("\nValidation passed.");
}
