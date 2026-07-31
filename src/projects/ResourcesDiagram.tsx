import { formatNumber, getCost, resourceColors } from "../shared/helpers/utils";
import ResourceName from "../shared/ResourceName";
import { useRequest } from "./helpers/hooks";
import type { Resource } from "./types";

const circleCoords = (pct: number, radius: number) =>
  `${Math.cos(2 * Math.PI * pct) * radius} ${Math.sin(2 * Math.PI * pct) * radius}`;

export default function ResourcesDiagram({
  requestId,
  grantNumber,
  creditColor = "#dee2e6",
  colors = resourceColors,
}: {
  requestId: number;
  grantNumber?: string;
  creditColor?: string;
  colors?: string[];
}) {
  const { request } = useRequest(requestId, grantNumber);
  if (!request) return null;

  let totalCost = 0;
  let credit: Resource | undefined;
  const other: Resource[] = [];

  for (const res of request.resources) {
    if (res.isBoolean) continue;
    if (res.isCredit) credit = res;
    else other.push(res);
    totalCost += getCost(res);
  }

  const svgPaths: React.ReactNode[] = [];
  const svgLabels: React.ReactNode[] = [];
  let cumulativePct = -0.25;

  // Items for the resources visualization
  const lis = [...other, credit].map((res, i) => {
    if (!res) return null;

    const resNumber = i + 1;
    const cost = getCost(res);
    const pct = cost / totalCost;
    const balance = res.requested - res.used;
    const available = Math.max(0, balance);
    const total = res.isCredit ? totalCost / res.exchangeRates.base.unitCost : res.requested;
    const remaining = total == 0 ? 0 : (100 * available) / total;

    const colorCss = res.isCredit ? creditColor : colors[i % colors.length];

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

      svgPaths.push(<path key={res.resourceId} d={pathData} style={{ fill: colorCss }} />);
      svgLabels.push(
        <circle key={`${res.resourceId}-circle`} cx={labelX} cy={labelY} r="8" fill="black" />,
        <text
          key={`${res.resourceId}-text`}
          x={labelX - 4}
          y={labelY + 4}
          fill="white"
          className="text-[0.75rem] font-bold"
        >
          {resNumber}
        </text>,
      );
    }

    if (res.isCredit)
      svgLabels.push(
        <foreignObject key="center-text" x="-50" y="-50" width="100" height="100">
          <div className="flex h-[100px] w-[100px] flex-col justify-center text-center text-[0.9rem] leading-[1.1]">
            <div>
              <strong className="block text-[1.1rem]">
                {formatNumber(available, { abbreviate: true })}
              </strong>
              {res.unit} available
            </div>
          </div>
        </foreignObject>,
      );

    return (
      <li key={res.resourceId} className="flex flex-row items-center whitespace-nowrap">
        <span className="inline-block size-[1.1rem] shrink-0 rounded-[0.55rem] bg-black text-center align-middle text-[0.75rem] font-bold leading-[1.1rem] text-white">
          {resNumber}
        </span>
        <span
          className="relative mx-2 inline-block h-6 w-[100px] shrink-0 border-2 align-middle"
          style={{ borderColor: colorCss }}
        >
          <span
            className="absolute left-0 top-0 inline-block h-full"
            style={{ backgroundColor: colorCss, width: `${remaining}%` }}
          ></span>
        </span>
        <strong className="whitespace-nowrap">
          <ResourceName resource={res} userGuide={false} />
          :&nbsp;
        </strong>
        <span className="overflow-hidden text-ellipsis whitespace-nowrap">
          {formatNumber(balance, { abbreviate: true })}{" "}
          {!res.isCredit ? <>of {formatNumber(total, { abbreviate: true })} </> : null}
          {res.unit} {res.isCredit ? "available" : "remaining"} ({Math.round(remaining)}%)
        </span>
      </li>
    );
  });

  return (
    <div className="flex flex-col gap-3 lg:flex-row">
      <div className="mb-3 flex flex-row items-center justify-center lg:w-1/4">
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
      <div className="mb-3 flex flex-col justify-center lg:w-3/4">
        <ul className="m-0 list-none p-0">{lis}</ul>
      </div>
    </div>
  );
}
