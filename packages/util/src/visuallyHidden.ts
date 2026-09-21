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
 *
 * `tableLayout` is here for the same reason, one layer down. The charts hide
 * their data tables with this, and on a `display: table` box `width` is only a
 * *minimum* — the table still sizes to its content, which `whiteSpace: nowrap`
 * then makes as wide as its longest row. Those tables laid out at 400-600px,
 * and being absolutely positioned with no positioned ancestor they were
 * measured against the document, so `/tracked` scrolled sideways into blank
 * space. `table-layout: fixed` makes the declared width authoritative; it is
 * inert on every non-table element, and changes nothing a screen reader reads.
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
  tableLayout: 'fixed',
} as const
