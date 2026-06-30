export const DARE_VOTE_BONUS = 5;
export const DARE_DEFAULT_POINTS = 5;

/** Community vote scoring (excludes bot and submitter). */
export function calculateDareVotePoints(upVotes: number, downVotes: number): number {
  if (downVotes > upVotes) return 0;
  const extraUpvotes = upVotes - downVotes;
  return DARE_DEFAULT_POINTS + extraUpvotes * DARE_VOTE_BONUS;
}

export const THUMBS_UP = "\u{1F44D}";
export const THUMBS_DOWN = "\u{1F44E}";

export function isVoteEmoji(emojiName: string | null | undefined): boolean {
  return emojiName === THUMBS_UP || emojiName === "👍" || emojiName === THUMBS_DOWN || emojiName === "👎";
}
