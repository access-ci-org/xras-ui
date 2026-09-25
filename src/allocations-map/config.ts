export const creditLevels: [string, number][] = [
  ["1", 1],
  ["1K", 1000],
  ["1M", 1000000],
  ["1B", 1000000000],
];

export type OrganizationType = "user" | "rp";

export const organizationTypes: Record<OrganizationType, { colors: string[] }> = {
  user: {
    colors: ["#ffc42d", "#fea92c", "#f98f30", "#f07537"],
  },
  rp: {
    colors: ["#48c0b9", "#2e9da4", "#207b8b", "#1a5b6e"],
  },
};
