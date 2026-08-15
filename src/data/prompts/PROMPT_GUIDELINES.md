# Built-in prompt guidelines

Internal rubric for curating the default truth/dare bank. Players are 18+.

Target size: roughly **1,200–1,500 truths** and **1,000–1,300 dares**, with each prompt a unique idea (no prefix-padding or verb-only variants).

## Truths

**Mix (count-based authoring, not runtime weights)**
- About 1/3 spicy / sex / kink (text-only answers)
- About 1/3 vulnerability / bonding / identity (WNRS-style inner life; original wording only)
- About 1/3 light / funny / confessions / hypotheticals

**Include**
- Consensual framing for kink/BDSM/sex questions
- Mix of light, medium, and explicit intensity in the spicy third
- Answerable in plain text (no proof required)
- Varied structure: history, rankings, hypotheticals, describe, this-or-that
- Inclusive: do not assume orientation, partner status, body type, or experience level

**Avoid**
- Non-consensual, illegal, or coercive scenarios
- Outing others by name or demanding identifiable info
- Near-duplicates that only rephrase the same question
- Prefix padding (`Honestly,`, `Be real:`, etc.) to inflate counts
- Copying or lightly paraphrasing commercial card decks

## Dares

**Allowed proof types** (must match Discord dare scoring: image, video, or audio attachment)

| Proof | Wording examples |
|-------|------------------|
| Voice note | "Send a voice note…", "Record a voice message…" |
| Screenshot | "Post a screenshot…" |
| Object photo | "Post a photo of [object]…" (not the player's body) |
| Handwritten / paper | "Post a photo of a handwritten note…" |
| Performance video | "Record a short video…" (clothed, non-sexual) |

**Reject**
- Nude, lingerie, underwear, body-part, bedroom, or bathroom media
- Sexual acts on camera; flirty content must be **voice-only**, never images of people
- IRL-only tasks, dangerous stunts, forced substance use
- High-privacy screenshots (browser history, DMs, full camera roll)
- Selfies, outfit photos, or body-focused images
- Verb-only variants of the same task (e.g. "Send a voice note X" vs "Record a voice message X")

**Each dare must state the proof type** so players know what to attach. Prefer objects most people can find; rare items should offer an alternative ("pet or stuffed animal").

## Length

Keep prompts under 300 characters when possible (400 max). Discord embed descriptions allow more, but brevity reads better in-game.

## Validation

Run `bun run validate-prompts` before committing changes to `src/data/prompts/`.
