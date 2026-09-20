import base from '@repo-radar/config/eslint/base'
import boundaries from '@repo-radar/config/eslint/boundaries'
import react from '@repo-radar/config/eslint/react'

/**
 * One root config for the whole workspace, so the architectural rules are
 * readable in a single place rather than scattered across packages.
 */
export default [...base, ...react, ...boundaries]
