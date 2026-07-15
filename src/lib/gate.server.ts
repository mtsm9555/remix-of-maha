/**
 * Gate removed. `requireUnlocked` is now a no-op so existing server-fn
 * handlers keep compiling without changes.
 */
export async function requireUnlocked(): Promise<void> {
  // intentionally empty — app is open
}
