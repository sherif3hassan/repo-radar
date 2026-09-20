import { useEffect } from 'react'

const ID = 'font-atkinson-hyperlegible'
const HREF =
  'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap'

/**
 * Loads the alternate face only when it is actually chosen.
 *
 * Bundling it with the default fonts would cost every visitor a download for a
 * setting almost none of them will turn on. The link is left in place once
 * added, so toggling back and forth does not refetch.
 */
export function useHyperlegibleFont(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || document.getElementById(ID)) return

    const link = document.createElement('link')
    link.id = ID
    link.rel = 'stylesheet'
    link.href = HREF
    document.head.append(link)
  }, [enabled])
}
