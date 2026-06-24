import { memo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Grid from "../shared/Grid";
import style from "./ExchangeRatesGrid.module.scss";

type ExchangeRatesProps = {
  columns: any[];
  rows: any[];
  onAddDiscountRate: () => void;
  dateErrors?: string[];
};

export const ExchangeRates = memo(function ExchangeRatesGrid({
  columns,
  rows,
  onAddDiscountRate,
  dateErrors = [],
}: ExchangeRatesProps) {
  return (
    <div className={style["exchange-rates-grid"]}>
      <div className={style["header-container"]}>
        <h2 className={style["header-title"]}>Exchange Rates</h2>
        <div className={style["header-buttons"]}>
          <Button onClick={onAddDiscountRate}>
            <Plus className="size-4" /> Add Discount Rate
          </Button>
        </div>
      </div>
      <Grid
        columns={columns}
        rows={rows}
        rowClasses={Array(rows.length).fill(style["vertical-align-center"])}
        scroll={false}
      />
      {dateErrors.length > 0 && (
        <div className={style["error-summary"]}>
          <ul>
            {dateErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});
