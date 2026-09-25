import { formatNumber, singularize } from "./helpers/utils";
import type { Resource } from "./types";

export default function ResourceDiscountsBanner({ resources }: { resources: Resource[] }) {
  const discountResources = resources.filter((res) => {
    const { base, current } = res.exchangeRates;
    return current.unitCost < base.unitCost;
  });

  if (!discountResources.length) return null;

  const names: string[] = [];
  const favicons: (string | undefined)[] = [];
  for (const resource of discountResources) {
    const { name, favicon } = resource.resourceProvider ?? { name: "" };
    if (!names.includes(name)) {
      names.push(name);
      favicons.push(favicon);
    }
  }

  const images = favicons.map((favicon, i) => (
    <span
      key={names[i]}
      title={names[i]}
      className="mr-1 inline-block size-6 rounded-full border bg-white bg-contain bg-center bg-no-repeat align-middle"
      style={{ backgroundImage: favicon ? `url(${favicon})` : undefined }}
    />
  ));

  return (
    <span className="flex items-center justify-between border-x bg-muted p-2 font-normal no-underline">
      <span>
        {images}
        Browse the list below to see discounts on {formatNumber(discountResources.length)}{" "}
        {singularize("resources", discountResources.length)} from {formatNumber(names.length)}{" "}
        {singularize("resource providers", names.length)}!
      </span>
    </span>
  );
}
