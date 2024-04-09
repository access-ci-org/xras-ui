import config from "../shared/helpers/config";
import { singularize } from "../shared/helpers/utils";
import { formatNumber } from "../shared/helpers/utils";

export default function ResourceDiscountsBanner({ resources }) {
  const discountResources = resources.filter((res) => {
    const { base, current } = res.exchangeRates;
    return current.unitCost < base.unitCost;
  });

  if (!discountResources.length) return;

  const names = [];
  const favicons = [];
  for (let resource of discountResources) {
    let { name, favicon } = resource.resourceProvider;
    if (!names.includes(name)) {
      names.push(name);
      favicons.push(favicon);
    }
  }

  const images = favicons.map((favicon, i) => (
    <span
      className="d-inline-block border me-1"
      style={{
        backgroundColor: "white",
        backgroundImage: `url(${favicon})`,
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "16px 16px",
        borderRadius: "24px",
        height: "24px",
        verticalAlign: "middle",
        width: "24px",
      }}
      key={names[i]}
      title={names[i]}
    />
  ));

  return (
    <a
      href={config.routes.resources_path()}
      className={
        "d-flex justify-content-between align-items-center p-2 " +
        "border-start border-end bg-secondary-subtle text-decoration-none fw-normal"
      }
    >
      <span>
        {images}
        Visit the resource catalog to see discounts on{" "}
        {formatNumber(discountResources.length)}{" "}
        {singularize("resources", discountResources.length)} from{" "}
        {formatNumber(names.length)}{" "}
        {singularize("resource providers", names.length)}!
      </span>
      <span className="fs-4">&rsaquo;</span>
    </a>
  );
}
