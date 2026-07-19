// ==========================================
// constants.ts
// MAHA Global Constants
// ==========================================

export const APP_NAME =
  "MAHA";

export const APP_VERSION =
  "1.0.0";

export const APP_TAGLINE =
  "AI Operating System";

export type AIState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking";

export const AI_COLORS = {

  idle: "#00d9ff",

  listening:
    "#00ffb3",

  thinking:
    "#6aa8ff",

  speaking:
    "#ffc857",

};

export const REACTOR = {

  desktopSize: 420,

  tabletSize: 340,

  mobileSize: 280,

};

export const WAVEFORM = {

  bars: 180,

  radius: 190,

  maxAmplitude: 40,

};

export const MENU_ITEMS = [

  {
    id: "memory",
    label: "Memory",
  },

  {
    id: "vision",
    label: "Vision",
  },

  {
    id: "files",
    label: "Files",
  },

  {
    id: "planner",
    label: "Planner",
  },

  {
    id: "settings",
    label: "Settings",
  },

];

export const ANIMATION = {

  slowRotation: 40,

  mediumRotation: 25,

  fastRotation: 18,

  breathing: 4,

  glow: 6,

};

export const PARTICLES = {

  count: 150,

  maxSize: 2,

  maxSpeed: 0.5,

};

export const UI = {

  commandBarHeight: 72,

  menuWidth: 240,

  headerSpacing: 12,

};