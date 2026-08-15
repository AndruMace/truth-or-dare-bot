import {
  TRUTH_CATEGORIES,
  DARE_CATEGORIES,
  loadDefaultPrompts,
} from "./manifest";

const MIN_COUNT = 1000;
const TRUTH_TARGET_LOW = 1200;
const TRUTH_TARGET_HIGH = 1500;
const DARE_TARGET_LOW = 1000;
const DARE_TARGET_HIGH = 1300;
const MAX_LENGTH = 400;
const NEAR_DUPE_PREFIX_LEN = 60;

/** Whole-word / phrase checks to avoid false positives (e.g. "power strip"). */
const DARE_BLOCKLIST_PATTERNS = [
  /\bnudes?\b/i,
  /\blingerie\b/i,
  /\bunderwear\b/i,
  /\bbathroom\b/i,
  /\bselfie\b/i,
  /\boutfit\b/i,
  /\bbedroom\b/i,
  /browser history/i,
  /photo roll/i,
  /camera roll/i,
  /\byour dms?\b/i,
  /\bdm history\b/i,
  /\bopen (?:a |your )?dms?\b/i,
  /\bnaked\b/i,
  /(?<!power )\bstrip(?:ping|tease|ped)?\b/i,
  /sexual act/i,
  /send a nude/i,
];

/** Strip proof-type prefixes so verb-only dare variants count as near-dupes. */
const PROOF_PREFIX =
  /^(honestly|be real|spicy edition|deep cut|hot take)[,:]?\s*|^(send a voice note|record a voice (?:note|message)|post a voice note|send a voice message)\s+(?:to\s+)?|^(post a screenshot of|post a photo of|record a (?:short |10-second |15-second )?video(?:\s+to)?|post a video)\s+/i;

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
  const stripped = text.replace(PROOF_PREFIX, "").trim();
  return normalize(stripped).slice(0, NEAR_DUPE_PREFIX_LEN);
}

export function validatePromptBank(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const { truths, dares } = loadDefaultPrompts();

  if (truths.length < MIN_COUNT) {
    errors.push(`Truths: ${truths.length} (minimum ${MIN_COUNT})`);
  } else if (truths.length < TRUTH_TARGET_LOW || truths.length > TRUTH_TARGET_HIGH) {
    warnings.push(
      `Truths: ${truths.length} (target ${TRUTH_TARGET_LOW}–${TRUTH_TARGET_HIGH})`,
    );
  }

  if (dares.length < MIN_COUNT) {
    errors.push(`Dares: ${dares.length} (minimum ${MIN_COUNT})`);
  } else if (dares.length < DARE_TARGET_LOW || dares.length > DARE_TARGET_HIGH) {
    warnings.push(
      `Dares: ${dares.length} (target ${DARE_TARGET_LOW}–${DARE_TARGET_HIGH})`,
    );
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
      const key = normalize(text);
      if (seen.has(key)) {
        errors.push(`Exact duplicate in ${label}: "${text.slice(0, 50)}..."`);
      } else {
        seen.set(key, text);
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
      warnings.push(
        `Near-duplicate (${NEAR_DUPE_PREFIX_LEN}-char prefix): "${prev.slice(0, 40)}..." vs "${text.slice(0, 40)}..."`,
      );
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
    for (const pattern of DARE_BLOCKLIST_PATTERNS) {
      if (pattern.test(text)) {
        errors.push(`Dare blocklist hit ${pattern}: "${text.slice(0, 60)}..."`);
      }
    }
    const hasProofHint =
      /voice note|voice message|screenshot|photo of|record.*video|post a video|handwritten/i.test(
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

  console.log(
    `\nTotals: ${loadDefaultPrompts().truths.length} truths, ${loadDefaultPrompts().dares.length} dares`,
  );

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
