import { useAtomValue, useSetAtom } from "jotai";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import Grid, { type GridColumn } from "../shared/Grid";
import {
  ADMIN_BTN_ICON,
  ADMIN_BTN_PRIMARY,
  ADMIN_GRID,
  ADMIN_GRID_WIDE_FIELDS,
  ADMIN_H2,
} from "../shared/adminTheme";
import { conversionLabel } from "./helpers/exchangeRates";
import {
  addExchangeRateAtom,
  dateErrorsAtom,
  deleteExchangeRateAtom,
  resourceDetailsAtom,
  updateBaseRateAtom,
  updateRateDateAtom,
  updateRateValueAtom,
} from "./atoms";

const today = new Date().toISOString().split("T")[0];

export const ExchangeRates = () => {
  const resourceDetails = useAtomValue(resourceDetailsAtom);
  const dateErrors = useAtomValue(dateErrorsAtom);
  const addExchangeRate = useSetAtom(addExchangeRateAtom);
  const deleteExchangeRate = useSetAtom(deleteExchangeRateAtom);
  const updateBaseRate = useSetAtom(updateBaseRateAtom);
  const updateRateValue = useSetAtom(updateRateValueAtom);
  const updateRateDate = useSetAtom(updateRateDateAtom);

  const exchangeRates = resourceDetails?.exchange_rates;
  if (!resourceDetails || !exchangeRates) return null;

  const unitType = resourceDetails.unit_type || "Resource Units";
  const discountRates = exchangeRates.discount_rates ?? [];

  const columns: GridColumn[] = [
    { key: "rate_type", name: "Rate Type", width: 150 },
    {
      key: "rate",
      name: "Exchange Rate",
      width: 100,
      type: "input",
      tooltip:
        "Exchange rate is the cost in ACCESS Credits of one resource unit. ACCESS Credits / exchange rate = resource units",
    },
    { key: "conversion", name: "Resource Units per ACCESS Credit", width: 150 },
    { key: "start_date", name: "Start Date", width: 150, type: "date", minDate: today },
    { key: "end_date", name: "End Date", width: 150, type: "date", minDate: today },
    {
      key: "actions",
      name: "",
      width: 80,
      type: "action",
      onChange: (rateId: number) => deleteExchangeRate(rateId),
    },
  ];

  const rows = [
    {
      rate_type: "Base Rate",
      rate: {
        value: (exchangeRates.base_rate ?? "").toString(),
        onChange: (value: string) => updateBaseRate(value),
      },
      conversion: conversionLabel(exchangeRates.base_rate, unitType),
    },
    ...discountRates.map((rate) => {
      const isRateEditable = rate.is_new || (rate.begin_date ?? "") > today;
      const isStartDateEditable = isRateEditable || rate.begin_date === "";
      const isEndDateEditable = rate.is_new || (rate.end_date ?? "") >= today || rate.end_date === "";

      return {
        rate_type: "Discount",
        rate: {
          value: rate.exchange_rate?.toString() ?? "",
          disabled: !isRateEditable,
          onChange: (value: string) => updateRateValue({ rateId: rate.id, value }),
        },
        conversion: conversionLabel(rate.exchange_rate, unitType),
        start_date: {
          value: rate.begin_date ?? "",
          disabled: !isStartDateEditable,
          error: rate.start_date_error,
          onChange: (value: string) => updateRateDate({ rateId: rate.id, dateField: "start_date", value }),
        },
        end_date: {
          value: rate.end_date ?? "",
          disabled: !isEndDateEditable,
          error: rate.end_date_error,
          onChange: (value: string) => updateRateDate({ rateId: rate.id, dateField: "end_date", value }),
        },
        actions: { id: rate.id },
      };
    }),
  ];

  return (
    <div className="mt-[12.8px] mb-[25.6px]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className={ADMIN_H2}>Exchange Rates</h2>
        <button type="button" className={ADMIN_BTN_PRIMARY} onClick={() => addExchangeRate()}>
          <Plus className={cn(ADMIN_BTN_ICON, "mr-2")} /> Add Discount Rate
        </button>
      </div>
      <Grid
        columns={columns}
        rows={rows}
        classes={cn(ADMIN_GRID, ADMIN_GRID_WIDE_FIELDS)}
        scroll={false}
      />
      {dateErrors.length > 0 && (
        <div className="mt-4 rounded-[4px] border border-[#f5c6cb] bg-[#f8d7da] p-4 text-[#721c24]">
          <ul className="m-0 list-disc pl-6">
            {dateErrors.map((error, index) => (
              <li key={index} className="mb-1">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
