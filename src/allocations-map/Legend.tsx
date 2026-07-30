import { organizationTypes, type OrganizationType } from "./config";
import type { ActiveOrg, CreditLevels } from "./types";

export function makeCircleSVG(radius: number, color: string) {
  const size = 2 * radius + 2;
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      stroke="white"
      strokeWidth="1"
      height={size}
      width={size}
    >
      <circle fill={color} cx={radius + 1} cy={radius + 1} r={radius} />
    </svg>
  );
}

export default function Legend({
  activeOrg,
  creditLevels,
  organizationType,
}: {
  activeOrg: ActiveOrg | null;
  creditLevels: CreditLevels | null;
  organizationType: OrganizationType;
}) {
  if (activeOrg || !creditLevels) return null;
  const levels = creditLevels.points.map((level, i) => (
    <div className="relative px-1 text-center text-xs font-bold [&_svg]:h-[42px]" key={level[0]}>
      {makeCircleSVG(5 * (i + 1), organizationTypes[organizationType].colors[i])}
      <br />
      <span className="label">{level[0]}</span>
    </div>
  ));
  return (
    <div className="pointer-events-none absolute bottom-[25px] left-[25px] bg-white/50 p-2.5">
      <h2 className="mb-0 mt-0 text-base">
        ACCESS Credits <small className="block text-xs font-normal italic">or credit equivalents</small>
      </h2>
      <div className="flex flex-row justify-between">{levels}</div>
    </div>
  );
}
