import confessions from "./truths/confessions.json";
import relationshipsDating from "./truths/relationships-dating.json";
import sexExperiences from "./truths/sex-experiences.json";
import sexPreferences from "./truths/sex-preferences.json";
import kinkBdsm from "./truths/kink-bdsm.json";
import spicyLight from "./truths/spicy-light.json";
import embarrassingFunny from "./truths/embarrassing-funny.json";

import voiceSinging from "./dares/voice-singing.json";
import voiceImpressions from "./dares/voice-impressions.json";
import voiceReadingConfess from "./dares/voice-reading-confess.json";
import screenshotAppsGames from "./dares/screenshot-apps-games.json";
import screenshotDiscordMemes from "./dares/screenshot-discord-memes.json";
import objectPhotoDesk from "./dares/object-photo-desk.json";
import objectPhotoRandom from "./dares/object-photo-random.json";
import performanceVideo from "./dares/performance-video.json";

export type PromptCategory = { file: string; prompts: string[] };

export const TRUTH_CATEGORIES: PromptCategory[] = [
  { file: "truths/confessions.json", prompts: confessions },
  { file: "truths/relationships-dating.json", prompts: relationshipsDating },
  { file: "truths/sex-experiences.json", prompts: sexExperiences },
  { file: "truths/sex-preferences.json", prompts: sexPreferences },
  { file: "truths/kink-bdsm.json", prompts: kinkBdsm },
  { file: "truths/spicy-light.json", prompts: spicyLight },
  { file: "truths/embarrassing-funny.json", prompts: embarrassingFunny },
];

export const DARE_CATEGORIES: PromptCategory[] = [
  { file: "dares/voice-singing.json", prompts: voiceSinging },
  { file: "dares/voice-impressions.json", prompts: voiceImpressions },
  { file: "dares/voice-reading-confess.json", prompts: voiceReadingConfess },
  { file: "dares/screenshot-apps-games.json", prompts: screenshotAppsGames },
  { file: "dares/screenshot-discord-memes.json", prompts: screenshotDiscordMemes },
  { file: "dares/object-photo-desk.json", prompts: objectPhotoDesk },
  { file: "dares/object-photo-random.json", prompts: objectPhotoRandom },
  { file: "dares/performance-video.json", prompts: performanceVideo },
];

export function loadDefaultPrompts(): { truths: string[]; dares: string[] } {
  return {
    truths: TRUTH_CATEGORIES.flatMap((c) => c.prompts),
    dares: DARE_CATEGORIES.flatMap((c) => c.prompts),
  };
}
