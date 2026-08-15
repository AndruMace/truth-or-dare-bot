import vulnerabilityBonding from "./truths/vulnerability-bonding.json";
import identityGrowth from "./truths/identity-growth.json";
import friendshipBelonging from "./truths/friendship-belonging.json";
import fearsInsecurity from "./truths/fears-insecurity.json";
import sexExperiences from "./truths/sex-experiences.json";
import sexPreferences from "./truths/sex-preferences.json";
import kinkBdsm from "./truths/kink-bdsm.json";
import spicyLight from "./truths/spicy-light.json";
import confessions from "./truths/confessions.json";
import relationshipsDating from "./truths/relationships-dating.json";
import embarrassingFunny from "./truths/embarrassing-funny.json";
import hypotheticalsValues from "./truths/hypotheticals-values.json";

import voiceSinging from "./dares/voice-singing.json";
import voiceImpressions from "./dares/voice-impressions.json";
import voiceReadingConfess from "./dares/voice-reading-confess.json";
import voiceStorytelling from "./dares/voice-storytelling.json";
import voiceFlirtyAudio from "./dares/voice-flirty-audio.json";
import screenshotAppsGames from "./dares/screenshot-apps-games.json";
import screenshotDiscordMemes from "./dares/screenshot-discord-memes.json";
import screenshotTasteMedia from "./dares/screenshot-taste-media.json";
import objectPhotoDesk from "./dares/object-photo-desk.json";
import objectPhotoRandom from "./dares/object-photo-random.json";
import objectPhotoCreative from "./dares/object-photo-creative.json";
import handwrittenNote from "./dares/handwritten-note.json";
import performanceVideo from "./dares/performance-video.json";
import timedChallenges from "./dares/timed-challenges.json";

export type PromptCategory = { file: string; prompts: string[] };

export const TRUTH_CATEGORIES: PromptCategory[] = [
  { file: "truths/vulnerability-bonding.json", prompts: vulnerabilityBonding },
  { file: "truths/identity-growth.json", prompts: identityGrowth },
  { file: "truths/friendship-belonging.json", prompts: friendshipBelonging },
  { file: "truths/fears-insecurity.json", prompts: fearsInsecurity },
  { file: "truths/sex-experiences.json", prompts: sexExperiences },
  { file: "truths/sex-preferences.json", prompts: sexPreferences },
  { file: "truths/kink-bdsm.json", prompts: kinkBdsm },
  { file: "truths/spicy-light.json", prompts: spicyLight },
  { file: "truths/confessions.json", prompts: confessions },
  { file: "truths/relationships-dating.json", prompts: relationshipsDating },
  { file: "truths/embarrassing-funny.json", prompts: embarrassingFunny },
  { file: "truths/hypotheticals-values.json", prompts: hypotheticalsValues },
];

export const DARE_CATEGORIES: PromptCategory[] = [
  { file: "dares/voice-singing.json", prompts: voiceSinging },
  { file: "dares/voice-impressions.json", prompts: voiceImpressions },
  { file: "dares/voice-reading-confess.json", prompts: voiceReadingConfess },
  { file: "dares/voice-storytelling.json", prompts: voiceStorytelling },
  { file: "dares/voice-flirty-audio.json", prompts: voiceFlirtyAudio },
  { file: "dares/screenshot-apps-games.json", prompts: screenshotAppsGames },
  { file: "dares/screenshot-discord-memes.json", prompts: screenshotDiscordMemes },
  { file: "dares/screenshot-taste-media.json", prompts: screenshotTasteMedia },
  { file: "dares/object-photo-desk.json", prompts: objectPhotoDesk },
  { file: "dares/object-photo-random.json", prompts: objectPhotoRandom },
  { file: "dares/object-photo-creative.json", prompts: objectPhotoCreative },
  { file: "dares/handwritten-note.json", prompts: handwrittenNote },
  { file: "dares/performance-video.json", prompts: performanceVideo },
  { file: "dares/timed-challenges.json", prompts: timedChallenges },
];

export function loadDefaultPrompts(): { truths: string[]; dares: string[] } {
  return {
    truths: TRUTH_CATEGORIES.flatMap((c) => c.prompts),
    dares: DARE_CATEGORIES.flatMap((c) => c.prompts),
  };
}
