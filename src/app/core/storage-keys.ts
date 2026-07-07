/** Shared storage keys, single source of truth across components. */

/** Session flag set on locale switch so the splash is skipped once after reload. */
export const SPLASH_SKIP_KEY = 'portfolio:splash:skip-once';

/** localStorage key for the persisted playground snippet (html/css/js JSON). */
export const PLAYGROUND_KEY = 'tools.playground.snippet';

/** localStorage key for the user's own Groq API key (BYO, never bundled). */
export const GROQ_KEY = 'tools.playground.groqKey';
