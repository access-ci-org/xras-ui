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
        tooltip:
          "Exchange rate is the cost in ACCESS Credits of one resource unit. ACCESS Credits / exchange rate = resource units",
      },
      {
        key: "start_date",
        name: "Start Date",
        width: 150,
        type: "date",
        minDate: new Date().toISOString().split("T")[0],
      },
      {
        key: "end_date",
        name: "End Date",
        width: 150,
        type: "date",
        minDate: new Date().toISOString().split("T")[0],
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

  const dateErrors = useMemo(() => {
    const errors = [];
    const discountRates =
      resourceData?.resource_details?.exchange_rates?.discount_rates || [];
    discountRates.forEach((rate) => {
      if (rate.start_date_error) {
        errors.push(rate.start_date_error);
      }
      if (rate.end_date_error) {
        errors.push(rate.end_date_error);
      }
    });
    return errors.filter((error) => error && error !== "");
  }, [resourceData]);

  const handleDateChange = useCallback(
    (rateId, dateField, newValue) => {
      const fieldMap = {
        start_date: "begin_date",
        end_date: "end_date",
      };

      const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("en-US", {
          timeZone: "UTC",
          month: "numeric",
          day: "numeric",
          year: "numeric",
        }).format(date);
      };

      const rate =
        resourceData?.resource_details?.exchange_rates?.discount_rates.find(
          (r) => r.id === rateId
        );

      if (!rate) return;

      const column = exchangeRateColumns.find((col) => col.key === dateField);
      const changes = { [fieldMap[dateField]]: newValue };
      const errors = {};

      if (!newValue) {
        errors[`${dateField}_error`] = "Date cannot be empty or invalid";
        dispatch({
          type: "UPDATE_EXCHANGE_RATE",
          payload: {
            rateId,
            changes: {
              ...changes,
              ...errors,
            },
          },
        });
        return;
      }

      // Get min/max dates from column configuration
      const columnMinDate = column?.minDate || "1900-01-01";
      const columnMaxDate = column?.maxDate || "2100-12-31";

      const isEndDate = dateField === "end_date";
      const effectiveMinDate =
        isEndDate && rate.begin_date ? rate.begin_date : columnMinDate;

      if (newValue < effectiveMinDate) {
        errors[`${dateField}_error`] = `${dateField.replace(
          "_",
          " "
        )} cannot be before ${formatDate(effectiveMinDate)}`;
      } else if (newValue > columnMaxDate) {
        errors[`${dateField}_error`] = `${dateField.replace(
          "_",
          " "
        )} cannot be after ${formatDate(columnMaxDate)}`;
      } else {
        errors[`${dateField}_error`] = "";
      }

      // Validate date relationships
      if (dateField === "start_date") {
        const currentEndDate = rate.end_date;
        if (currentEndDate && newValue > currentEndDate) {
          errors.end_date_error = `End date (${formatDate(
            currentEndDate
          )}) cannot be before start date (${formatDate(newValue)})`;
        } else {
          errors.end_date_error = "";
        }
      }

      dispatch({
        type: "UPDATE_EXCHANGE_RATE",
        payload: {
          rateId,
          changes: {
            ...changes,
            ...errors,
          },
        },
      });
    },
    [dispatch, resourceData, exchangeRateColumns]
  );

  const handleAddDiscountRate = useCallback(() => {
    const today_date = new Date();
    const begin_date = today_date.toISOString().split("T")[0];
    // Set end date to 15 days from begin date UTC
    const end_date = new Date(
      today_date.setUTCDate(today_date.getUTCDate() + 15)
    )
      .toISOString()
      .split("T")[0];
    const newRate = {
      id: Date.now(),
      exchange_rate: "1.0",
      begin_date: begin_date,
      end_date: end_date,
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
          error: rate.start_date_error,
        },
        end_date: {
          value: rate.end_date || "",
          onChange: (newValue) =>
            handleDateChange(rate.id, "end_date", newValue),
          error: rate.end_date_error,
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
    dateErrors,
  };
};
