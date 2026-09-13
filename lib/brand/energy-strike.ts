export type EnergyStrikeId =
  | "forge-green"
  | "sapphire-blue"
  | "lumina-purple"
  | "solar-gold"
  | "ember-red"
  | "ion-silver";

export type EnergyStrike = {
  id: EnergyStrikeId;
  name: string;
  hex: string;
  /** Logo asset when we have a rendered strike; otherwise null uses default forge-green. */
  logoSrc: string | null;
};

export const ENERGY_STRIKES: readonly EnergyStrike[] = [
  {
    id: "forge-green",
    name: "Forge Green",
    hex: "#b6ff2e",
    logoSrc: "/brand/logo-forge-green.webp",
  },
  {
    id: "sapphire-blue",
    name: "Sapphire Blue",
    hex: "#3d9bff",
    logoSrc: "/brand/logo-sapphire-blue-ember.webp",
  },
  {
    id: "lumina-purple",
    name: "Lumina Purple",
    hex: "#c44cff",
    logoSrc: "/brand/logo-lumina-purple.webp",
  },
  {
    id: "solar-gold",
    name: "Solar Gold",
    hex: "#ffc93a",
    logoSrc: null,
  },
  {
    id: "ember-red",
    name: "Ember Red",
    hex: "#ff3b3b",
    logoSrc: null,
  },
  {
    id: "ion-silver",
    name: "Ion Silver",
    hex: "#e8ece8",
    logoSrc: null,
  },
] as const;

export const DEFAULT_ENERGY_STRIKE: EnergyStrikeId = "forge-green";

export function getEnergyStrike(id: EnergyStrikeId): EnergyStrike {
  return ENERGY_STRIKES.find((s) => s.id === id) ?? ENERGY_STRIKES[0];
}

export const ENERGY_STRIKE_STORAGE_KEY = "bf-energy-strike";
