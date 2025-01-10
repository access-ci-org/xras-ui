import { useMemo, useCallback } from "react";

export const useExchangeRates = (resourceData, dispatch) => {
  const handleDeleteRate = useCallback(
    (rateId) => {
      dispatch({
        type: "DELETE_EXCHANGE_RATE",
        payload: rateId,
      });
    },
    [dispatch]
  );

  const exchangeRateColumns = useMemo(
    () => [
      {
        key: "rate_type",
        name: "Rate Type",
        width: 150,
      },
      {
        key: "rate",
        name: "Rate",
        width: 100,
        type: "input",
      },
      {
        key: "start_date",
        name: "Start Date",
        width: 150,
        type: "input",
      },
      {
        key: "end_date",
        name: "End Date",
        width: 150,
        type: "input",
      },
      {
        key: "actions",
        name: "",
        width: 80,
        type: "action",
        onChange: handleDeleteRate,
      },
    ],
    [handleDeleteRate]
  );

  const handleBaseRateChange = useCallback(
    (newValue) => {
      dispatch({
        type: "UPDATE_BASE_RATE",
        payload: newValue,
      });
    },
    [dispatch]
  );

  const handleRateChange = useCallback(
    (rateId, newValue) => {
      dispatch({
        type: "UPDATE_EXCHANGE_RATE",
        payload: {
          rateId,
          changes: { exchange_rate: newValue },
        },
      });
    },
    [dispatch]
  );

  const handleDateChange = useCallback(
    (rateId, dateField, newValue) => {
      const fieldMap = {
        start_date: "begin_date",
        end_date: "end_date",
      };

      dispatch({
        type: "UPDATE_EXCHANGE_RATE",
        payload: {
          rateId,
          changes: { [fieldMap[dateField]]: newValue },
        },
      });
    },
    [dispatch]
  );

  const handleAddDiscountRate = useCallback(() => {
    const newRate = {
      id: Date.now(),
      exchange_rate: "1.0",
      begin_date: new Date().toISOString().split("T")[0],
      end_date: "",
    };

    dispatch({
      type: "ADD_EXCHANGE_RATE",
      payload: newRate,
    });
  }, [dispatch]);

  const exchangeRateRows = useMemo(() => {
    const exchangeRates = resourceData?.resource_details?.exchange_rates;
    const baseRate = exchangeRates?.base_rate ?? ""; // Default to empty string if no base rate
    const discountRates = exchangeRates?.discount_rates || [];

    return [
      // Base rate row
      {
        rate_type: "Base Rate",
        rate: {
          value: baseRate.toString(),
          onChange: (newValue) => handleBaseRateChange(newValue),
        },
        start_date: {
          value: "",
          disabled: true,
        },
        end_date: {
          value: "",
          disabled: true,
        },
        actions: null,
      },
      // Discount rate rows
      ...discountRates.map((rate) => ({
        rate_type: "Discount",
        rate: {
          value: rate.exchange_rate?.toString() || "",
          onChange: (newValue) => handleRateChange(rate.id, newValue),
        },
        start_date: {
          value: rate.begin_date || "",
          onChange: (newValue) =>
            handleDateChange(rate.id, "start_date", newValue),
        },
        end_date: {
          value: rate.end_date || "",
          onChange: (newValue) =>
            handleDateChange(rate.id, "end_date", newValue),
        },
        actions: { id: rate.id },
      })),
    ];
  }, [resourceData, handleBaseRateChange, handleRateChange, handleDateChange]);

  return {
    exchangeRateColumns,
    exchangeRateRows,
    handleAddDiscountRate,
    handleDeleteRate,
  };
};
