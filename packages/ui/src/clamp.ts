/**
 * Truncate text to `lines`, with an ellipsis.
 *
 * A repository description can be a paragraph. Left unclamped, a list of
 * twenty results becomes several screens of scrolling where the useful
 * information — name, stars, activity — is spread too far apart to compare.
 *
 * The full text stays in the DOM, so screen readers and agents still get it.
 */
export const clampLines = (lines: number) =>
  ({
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: lines,
    overflow: 'hidden',
    wordBreak: 'break-word',
  }) as const
