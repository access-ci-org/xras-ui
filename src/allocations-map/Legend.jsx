import { organizationTypes } from "./config";
import style from "./Legend.module.scss";

export function makeCircleSVG(radius, color) {
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

export default function Legend({ activeOrg, creditLevels, organizationType }) {
  if (activeOrg || !creditLevels) return;
  const levels = creditLevels.points.map((level, i) => (
    <div className={style.symbol} key={level[0]}>
      {makeCircleSVG(
        5 * (i + 1),
        organizationTypes[organizationType].colors[i]
      )}
      <br />
      <span className="label">{level[0]}</span>
    </div>
  ));
  return (
    <div className={style.legend}>
      <h2 className="mb-0 mt-0 text-base">
        ACCESS Credits <small>or credit equivalents</small>
      </h2>
      <div className={style.symbols}>{levels}</div>
    </div>
  );
}
