# Built-in prompt guidelines

Internal rubric for curating the default truth/dare bank. Players are 18+.

## Truths

**Include**
- Consensual framing for kink/BDSM/sex questions
- Mix of light, medium, and explicit intensity
- Answerable in plain text (no proof required)
- Varied structure: history, rankings, hypotheticals, describe, would-you-rather

**Avoid**
- Non-consensual, illegal, or coercive scenarios
- Outing others by name or demanding identifiable info
- Assuming one orientation, body type, or experience level
- Near-duplicates that only rephrase the same question

## Dares

**Allowed proof types** (must match Discord dare scoring: image, video, or audio attachment)

| Proof | Wording examples |
|-------|------------------|
| Voice note | "Send a voice note…", "Record a voice message…" |
| Screenshot | "Post a screenshot…" |
| Object photo | "Post a photo of [object]…" (not the player's body) |
| Performance video | "Record a short video…" (clothed, non-sexual) |

**Reject**
- Nude, lingerie, underwear, body-part, bedroom, or bathroom media
- Sexual acts on camera
- IRL-only tasks, dangerous stunts, forced substance use
- High-privacy screenshots (browser history, DMs, full camera roll)
- Selfies, outfit photos, or body-focused images

**Each dare must state the proof type** so players know what to attach.

## Length

Keep prompts under 300 characters when possible (400 max). Discord embed descriptions allow more, but brevity reads better in-game.

## Validation

Run `bun run validate-prompts` before committing changes to `src/data/prompts/`.
