import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const ROOT = join(import.meta.dir, "../src/data/prompts/dares");

function load(file: string): string[] {
  return JSON.parse(readFileSync(join(ROOT, file), "utf8"));
}

function save(file: string, prompts: string[]) {
  writeFileSync(join(ROOT, file), JSON.stringify(prompts, null, 2) + "\n");
}

function addUnique(file: string, extras: string[]) {
  const existing = load(file);
  const set = new Set(existing.map((p) => p.toLowerCase()));
  for (const e of extras) {
    if (!set.has(e.toLowerCase())) {
      existing.push(e);
      set.add(e.toLowerCase());
    }
  }
  save(file, existing);
  return existing.length;
}

const singing = [
  "Send a voice note singing the chorus of your favorite song.",
  "Send a voice note singing happy birthday in an opera voice.",
  "Send a voice note singing the alphabet to a pop tune.",
  "Send a voice note humming the intro of a song until someone guesses it.",
  "Send a voice note singing one line of a Disney song dramatically.",
  "Send a voice note beatboxing for 10 seconds, then singing one word.",
  "Send a voice note singing your notification sound as lyrics.",
  "Send a voice note singing 'Twinkle Twinkle' like a metal song.",
  "Send a voice note singing one line of the last song you listened to.",
  "Send a voice note singing a made-up jingle about this server.",
  "Send a voice note singing your ringtone like a chart-topper.",
  "Send a voice note singing a nursery rhyme like a rock ballad.",
  "Send a voice note singing one line of a song stuck in your head.",
  "Send a voice note humming a TV show theme for others to guess.",
  "Send a voice note singing 'Happy' by Pharrell in a monotone voice.",
  "Send a voice note singing a commercial jingle you remember.",
  "Send a voice note singing your Discord status as lyrics.",
  "Send a voice note singing a lullaby in an aggressive voice.",
  "Send a voice note singing one line of a song in falsetto.",
  "Send a voice note singing your Wi-Fi name as if it's a love song.",
  "Send a voice note singing the words on the nearest food label.",
  "Send a voice note singing a sports team chant you know.",
  "Send a voice note singing your coffee order like a ballad.",
  "Send a voice note singing the alphabet backwards to any tune.",
  "Send a voice note singing a weather forecast dramatically.",
  "Send a voice note singing your favorite meme audio.",
  "Send a voice note singing one line in the style of a sea shanty.",
  "Send a voice note singing a birthday song for a random server member.",
  "Send a voice note humming the Jeopardy thinking music for 10 seconds.",
  "Send a voice note singing a made-up theme song for your day.",
  "Send a voice note singing the lyrics of a song you hate on purpose.",
  "Send a voice note singing your phone model name as an anthem.",
  "Send a voice note singing a tongue twister to a melody.",
  "Send a voice note singing the days of the week as a jazz riff.",
  "Send a voice note singing your username like a Broadway number.",
];
save("voice-singing.json", singing);

const reading = [
  "Send a voice note reading the last text you sent dramatically.",
  "Send a voice note reading a random channel message like Shakespeare.",
  "Send a voice note telling a clean joke.",
  "Send a voice note confessing something silly.",
  "Send a voice note reading a product label near you like poetry.",
  "Send a voice note saying something nice about three people in the server.",
  "Send a voice note reading your battery percentage like breaking news.",
  "Send a voice note reciting a tongue twister three times fast.",
  "Send a voice note saying the alphabet backwards as fast as you can.",
  "Send a voice note reading a warning label dramatically.",
  "Send a voice note complimenting the server in one sentence.",
  "Send a voice note reading a calendar event like epic fantasy.",
  "Send a voice note listing five things you're grateful for quickly.",
  "Send a voice note reading a meme caption in a serious tone.",
  "Send a voice note confessing your most-used emoji.",
  "Send a voice note describing your day in one dramatic sentence.",
  "Send a voice note reading a nutrition label like a love letter.",
  "Send a voice note saying hello in three accents.",
  "Send a voice note reading a sticky note on your desk.",
  "Send a voice note giving a one-sentence review of anything nearby.",
  "Send a voice note reading the channel topic like a movie trailer.",
  "Send a voice note explaining how to make toast like a TED Talk.",
  "Send a voice note reading your Discord username like a royal title.",
  "Send a voice note listing three apps you opened today.",
  "Send a voice note describing your current mood using only food metaphors.",
  "Send a voice note reading the rules of rock-paper-scissors like law.",
  "Send a voice note narrating what you see out your window for 15 seconds.",
  "Send a voice note saying a tongue twister in a whisper.",
  "Send a voice note reading a spam email subject line dramatically.",
  "Send a voice note introducing yourself like a wrestling announcer.",
  "Send a voice note explaining Discord to a medieval peasant.",
  "Send a voice note reading your most recent notification (redact private info).",
  "Send a voice note counting to 20 in the most bored voice possible.",
  "Send a voice note describing what you're wearing using only colors.",
  "Send a voice note reading a fortune-cookie style prediction for the server.",
];
save("voice-reading-confess.json", reading);

addUnique("voice-impressions.json", [
  "Send a voice note doing your best ASMR whisper for 10 seconds.",
  "Send a voice note as a flight attendant giving safety instructions for your room.",
  "Send a voice note as an auctioneer selling a pencil.",
  "Send a voice note as a yoga instructor guiding a stretch for your pinky.",
  "Send a voice note as a villain explaining their evil plan involving snacks.",
  "Send a voice note as a sports commentator for someone making coffee.",
  "Send a voice note as a museum tour guide describing your desk.",
  "Send a voice note as a late-night radio host taking a call about socks.",
  "Send a voice note as a GPS that is extremely judgmental.",
  "Send a voice note as a chef judging a sandwich you invent.",
  "Send a voice note as a detective interrogating a missing remote.",
  "Send a voice note as a motivational speaker about drinking water.",
  "Send a voice note as a nature documentary narrator watching your pet or a plant.",
  "Send a voice note as a game tutorial NPC explaining how to sit down.",
  "Send a voice note as a weather reporter covering a sock on the floor.",
]);

addUnique("screenshot-apps-games.json", [
  "Post a screenshot of your phone's battery percentage screen.",
  "Post a screenshot of your Discord server list (hide DMs).",
  "Post a screenshot of your currently playing song (full player).",
  "Post a screenshot of a game pause menu.",
  "Post a screenshot of your phone's dark mode settings.",
  "Post a screenshot of your desktop wallpaper.",
  "Post a screenshot of your Discord notification settings page.",
  "Post a screenshot of a shopping wishlist (redact prices if you want).",
  "Post a screenshot of your phone's widget screen.",
  "Post a screenshot of a cooking timer or stopwatch app.",
  "Post a screenshot of your email inbox unread count (blur subjects).",
  "Post a screenshot of a map zoomed out on your city (no exact address).",
  "Post a screenshot of your Discord appearance/theme settings.",
  "Post a screenshot of a random Wikipedia article you're on.",
  "Post a screenshot of your phone's storage usage chart.",
  "Post a screenshot of a game inventory or loadout screen.",
  "Post a screenshot of your Discord keybinds page.",
  "Post a screenshot of a news homepage (any outlet).",
  "Post a screenshot of your phone's control center or quick settings.",
  "Post a screenshot of a spreadsheet or notes with a silly title.",
  "Post a screenshot of your Discord advanced settings.",
  "Post a screenshot of a QR code you have saved (any).",
  "Post a screenshot of your phone's language/region settings.",
  "Post a screenshot of a game map or world select screen.",
  "Post a screenshot of your Discord registered games list.",
]);

addUnique("screenshot-discord-memes.json", [
  "Post a screenshot of a funny public message in this server (blur names if needed).",
  "Post a screenshot of your Discord friend activity panel.",
  "Post a screenshot of a custom emoji reaction you like.",
  "Post a screenshot of a GIF search result you almost sent.",
  "Post a screenshot of your Discord voice settings.",
  "Post a screenshot of a server boost progress or perk list.",
  "Post a screenshot of your Discord accessibility settings.",
  "Post a screenshot of a channel list with funny channel names.",
  "Post a screenshot of your Discord streamer mode settings.",
  "Post a screenshot of a public announcement channel message.",
  "Post a screenshot of your Discord app version in settings.",
  "Post a screenshot of a sticker you almost used.",
  "Post a screenshot of your Discord privacy & safety page.",
  "Post a screenshot of a poll result in any server.",
  "Post a screenshot of a stage or event listing if available.",
  "Post a screenshot of your Discord text & images settings.",
  "Post a screenshot of a bot help message.",
  "Post a screenshot of your Discord overlay settings.",
  "Post a screenshot of a public rules channel bullet you find funny.",
  "Post a screenshot of your Discord hardware acceleration toggle.",
  "Post a screenshot of a meme template you have saved.",
  "Post a screenshot of your Discord window zoom level.",
  "Post a screenshot of a public welcome message from any server.",
  "Post a screenshot of your Discord activity privacy settings.",
  "Post a screenshot of a public emoji list from this server.",
]);

addUnique("object-photo-desk.json", [
  "Post a photo of your mousepad.",
  "Post a photo of a cable tangle near your desk.",
  "Post a photo of your webcam or mic setup.",
  "Post a photo of a sticky note on your monitor (redact info).",
  "Post a photo of your chair from the side.",
  "Post a photo of a drink on your desk right now.",
  "Post a photo of your phone charger.",
  "Post a photo of a notebook or journal on your desk.",
  "Post a photo of your speakers or soundbar.",
  "Post a photo of a USB stick or SD card.",
  "Post a photo of your desk lamp turned on.",
  "Post a photo of a controller or peripheral you use.",
  "Post a photo of your trash can or recycling bin near your desk.",
  "Post a photo of a coaster or desk mat corner.",
  "Post a photo of your surge protector or outlet setup.",
  "Post a photo of a sticker on your laptop or desk.",
  "Post a photo of your glasses or sunglasses if nearby.",
  "Post a photo of a tissue box or wipes on your desk.",
  "Post a photo of your desk from above (top-down).",
  "Post a photo of a clock or timer on your desk.",
  "Post a photo of your backpack or bag near your workspace.",
  "Post a photo of a charger brick.",
  "Post a photo of your keyboard from a low angle.",
  "Post a photo of a desk drawer opened (one item).",
  "Post a photo of your monitor bezel or stand.",
]);

addUnique("object-photo-random.json", [
  "Post a photo of something pink near you.",
  "Post a photo of something black near you.",
  "Post a photo of something white near you.",
  "Post a photo of a plant leaf up close.",
  "Post a photo of a light switch.",
  "Post a photo of a doorknob.",
  "Post a photo of a sock (not on a foot).",
  "Post a photo of a spoon or fork.",
  "Post a photo of a remote control.",
  "Post a photo of a pillow.",
  "Post a photo of a blanket texture.",
  "Post a photo of a houseplant pot.",
  "Post a photo of a fridge magnet.",
  "Post a photo of a laundry basket (closed is fine).",
  "Post a photo of a lamp shade.",
  "Post a photo of a window latch or handle.",
  "Post a photo of a rug pattern.",
  "Post a photo of a bookshelf spine row.",
  "Post a photo of a charger cable coiled.",
  "Post a photo of a water bottle label.",
  "Post a photo of a cereal box or snack packaging.",
  "Post a photo of a shoe sole.",
  "Post a photo of a wall outlet.",
  "Post a photo of a ceiling corner.",
  "Post a photo of a house key (no address tags).",
]);

addUnique("performance-video.json", [
  "Record a short video spinning in a chair once.",
  "Record a 10-second video doing jazz hands.",
  "Record a short video pretending to catch something invisible.",
  "Record a 10-second video walking like a crab.",
  "Record a short video doing a dramatic door entrance.",
  "Record a 10-second video pretending to type extremely fast.",
  "Record a short video balancing a book on your head for 5 seconds.",
  "Record a 10-second video doing the wave with one arm.",
  "Record a short video pretending to open a stubborn jar.",
  "Record a 10-second video doing a silent scream.",
  "Record a short video showing your best handshake with the air.",
  "Record a 10-second video pretending to be stuck in slow motion.",
  "Record a short video doing a tiny victory lap around your chair.",
  "Record a 10-second video pretending to take a photo of the camera.",
  "Record a short video doing your best zombie walk.",
  "Record a 10-second video pretending to juggle one object badly.",
  "Record a short video doing a dramatic curtain bow with a towel.",
  "Record a 10-second video pretending to row while sitting.",
  "Record a short video doing finger snaps in a rhythm.",
  "Record a 10-second video pretending to cast a fishing line.",
  "Record a short video doing your best robot reboot sequence.",
  "Record a 10-second video pretending to dodge imaginary lasers.",
  "Record a short video doing a tiny hop three times.",
  "Record a 10-second video pretending to present a weather map.",
  "Record a short video ending with a freeze-frame pose.",
]);

const { loadDefaultPrompts } = await import("../src/data/prompts/manifest.ts");
const { truths, dares } = loadDefaultPrompts();
console.log(JSON.stringify({ truths: truths.length, dares: dares.length }, null, 2));
for (const f of [
  "voice-singing.json",
  "voice-impressions.json",
  "voice-reading-confess.json",
  "screenshot-apps-games.json",
  "screenshot-discord-memes.json",
  "object-photo-desk.json",
  "object-photo-random.json",
  "performance-video.json",
]) {
  console.log(f, load(f).length);
}
