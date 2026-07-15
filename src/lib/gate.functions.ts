import { createServerFn } from "@tanstack/react-start";

/**
 * Gate removed. These stubs exist only so legacy call sites keep compiling
 * while the app is fully open. Delete once no caller remains.
 */

export const unlockForUser = createServerFn({ method: "POST" }).handler(async () => ({
  ok: true as const,
}));

export const lockSite = createServerFn({ method: "POST" }).handler(async () => ({
  ok: true as const,
}));

export const checkUnlocked = createServerFn({ method: "GET" }).handler(async () => ({
  unlocked: true,
}));
