import { useRequest } from "./helpers/hooks";
import {
  formatNumber,
  formatResource,
  getCost,
  resourceColors,
} from "./helpers/utils";
import style from "./ResourcesDiagram.module.scss";

const circleCoords = (pct, radius) =>
  `${Math.cos(2 * Math.PI * pct) * radius} ${
    Math.sin(2 * Math.PI * pct) * radius
  }`;

export default function ResourcesDiagram({
  requestId,
  grantNumber,
  creditColorClass = "gray-300",
  colorClasses = resourceColors,
}) {
  const { request } = useRequest(requestId, grantNumber);
  if (!request) return;

  let totalCost = 0;
  let credit;
  const other = [];

  for (let res of request.resources) {
    if (res.isBoolean) continue;
    res.isCredit ? (credit = res) : other.push(res);
    totalCost += getCost(res);
  }

  const svgPaths = [];
  const svgLabels = [];
  let cumulativePct = -0.25;

  // Items for the resources visualization
  const lis = [...other, credit].map((res, i) => {
    if (!res) return null;

    const resNumber = i + 1;
    const cost = getCost(res);
    const pct = cost / totalCost;
    const balance = res.requested - res.used;
    const available = Math.max(0, balance);
    const total = res.isCredit
      ? totalCost / res.exchangeRates.base.unitCost
      : res.requested;
    const remaining = total == 0 ? 0 : (100 * available) / total;

    const color = res.isCredit
      ? creditColorClass
      : colorClasses[i % colorClasses.length];

    const colorCss = `var(--bs-${color})`;

    if (pct > 0) {
      const startPct = cumulativePct;
      const labelPct = cumulativePct + pct / 2;
      const endPct = (cumulativePct += pct);
      const lgArc = pct > 0.5 ? 1 : 0;

      const pathData = [
        `M ${circleCoords(startPct, 100)}`,
        `A 100 100 0 ${lgArc} 1 ${circleCoords(endPct, 100)}`,
        `L ${circleCoords(endPct, 50)}`,
        `A 50 50 0 ${lgArc} 0 ${circleCoords(startPct, 50)}`,
      ].join(" ");

      const [labelX, labelY] = circleCoords(labelPct, 75)
        .split(" ")
        .map((val) => parseFloat(val));

      svgPaths.push(
        <path key={res.resourceId} d={pathData} style={{ fill: colorCss }} />
      );
      svgLabels.push(
        <circle
          key={`${res.resourceId}-circle`}
          cx={labelX}
          cy={labelY}
          r="8"
          fill="black"
        />,
        <text
          key={`${res.resourceId}-text`}
          x={labelX - 4}
          y={labelY + 4}
          fill="white"
          className={style.number}
        >
          {resNumber}
        </text>
      );
    }

    if (res.isCredit)
      svgLabels.push(
        <foreignObject
          key="center-text"
          x="-50"
          y="-50"
          width="100"
          height="100"
        >
          <div className={style.text}>
            <div>
              <strong>{formatNumber(available, { abbreviate: true })}</strong>
              {res.unit} available
            </div>
          </div>
        </foreignObject>
      );

    return (
      <li key={res.resourceId} className={style.item}>
        <span className={style.number}>{resNumber}</span>
        <span
          className={`${style.outer} ms-2 me-2`}
          style={{ borderColor: colorCss }}
        >
          <span
            className={style.inner}
            style={{
              backgroundColor: colorCss,
              width: `${remaining}%`,
            }}
          ></span>
        </span>
        <strong className={style.name}>
          {formatResource(res, { userGuide: false })}:&nbsp;
        </strong>
        {
          <span className={style.details}>
            {formatNumber(balance, { abbreviate: true })}{" "}
            {!res.isCredit ? (
              <>of {formatNumber(total, { abbreviate: true })} </>
            ) : null}
            {res.unit} {res.isCredit ? "available" : "remaining"} (
            {Math.round(remaining)}%)
          </span>
        }
      </li>
    );
  });

  return (
    <div className="row">
      <div className="col-lg-3 mb-3 d-flex flex-row align-items-center justify-content-center">
        <svg
          version="1.1"
          viewBox="-100 -100 200 200"
          width="200"
          height="200"
          xmlns="http://www.w3.org/2000/svg"
        >
          {svgPaths}
          {svgLabels}
        </svg>
      </div>
      <div className="col-lg-9 mb-3 d-flex flex-column justify-content-center">
        <ul className={style.items}>{lis}</ul>
      </div>
    </div>
  );
}
