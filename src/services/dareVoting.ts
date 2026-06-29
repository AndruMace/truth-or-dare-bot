export const DARE_VOTE_UP_VALUE = 2;
export const DARE_VOTE_DOWN_VALUE = 2;
export const DARE_DEFAULT_POINTS = 2;

/** Net dare points from community vote counts (excludes bot reactions). */
export function calculateDareVotePoints(upVotes: number, downVotes: number): number {
  if (downVotes > upVotes) return 0;
  if (upVotes === 0 && downVotes === 0) return DARE_DEFAULT_POINTS;
  return Math.max(0, upVotes * DARE_VOTE_UP_VALUE - downVotes * DARE_VOTE_DOWN_VALUE);
}

export const THUMBS_UP = "\u{1F44D}";
export const THUMBS_DOWN = "\u{1F44E}";

export function isVoteEmoji(emojiName: string | null | undefined): boolean {
  return emojiName === THUMBS_UP || emojiName === "👍" || emojiName === THUMBS_DOWN || emojiName === "👎";
}
