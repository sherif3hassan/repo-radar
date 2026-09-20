/**
 * Present to assistive technology and to anything reading the DOM, absent from
 * the visual layout.
 *
 * `display: none` would remove it from the accessibility tree too, which is the
 * opposite of the point: this is for text a sighted user gets from colour,
 * position or an icon, and everyone else needs spelled out.
 */
export const visuallyHidden = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
} as const
