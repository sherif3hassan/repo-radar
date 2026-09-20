/**
 * Present to assistive technology and to anything reading the DOM, absent from
 * the visual layout.
 *
 * `display: none` would remove it from the accessibility tree too, which is the
 * opposite of the point: this is for text a sighted user gets from colour,
 * position or an icon, and everyone else needs spelled out.
 *
 * Every value here is consumed through MUI's `sx`, whose sizing transform
 * turns a bare `width`/`height` number of 1 or less into a *percentage*
 * (`1` → `100%`), not a pixel value. `width: 1` therefore rendered as a
 * page-sized, page-positioned box — clipped from view, but still counted
 * in the document's scrollable area, which is what caused every page to
 * scroll horizontally past the viewport. Units make the values literal.
 */
export const visuallyHidden = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
} as const
