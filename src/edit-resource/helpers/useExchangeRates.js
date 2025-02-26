import { useCallback } from "react";

export const useExchangeRates = (resourceData, dispatch) => {
  const handleDeleteRate = useCallback(
    (rateId) => {
      dispatch({
        type: "DELETE_EXCHANGE_RATE",
        payload: rateId,
      });

      const remainingRates =
        resourceData?.resource_details?.exchange_rates?.discount_rates.filter(
          (rate) => rate.id !== rateId
        ) || [];

      remainingRates.forEach((rate) => {
        if (rate.begin_date && rate.end_date) {
          // Clear any overlap errors after deleting a rate
          dispatch({
            type: "UPDATE_EXCHANGE_RATE",
            payload: {
              rateId: rate.id,
              changes: {
                start_date_error: "",
                end_date_error: "",
              },
            },
          });
        }
      });
    },
    [dispatch, resourceData]
  );

  const exchangeRateColumns = [
    {
      key: "rate_type",
      name: "Rate Type",
      width: 150,
    },
    {
      key: "rate",
      name: "Exchange Rate",
      width: 100,
      type: "input",
      tooltip:
        "Exchange rate is the cost in ACCESS Credits of one resource unit. ACCESS Credits / exchange rate = resource units",
    },
    {
      key: "conversion",
      name: "Resource Units per ACCESS Credit",
      width: 150,
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
  ];

  const handleBaseRateChange = (newValue) => {
    dispatch({
      type: "UPDATE_BASE_RATE",
      payload: newValue,
    });
  };

  const handleRateChange = (rateId, newValue) => {
    const changes = { exchange_rate: newValue };
    const errors = {};

    if (!newValue) {
      errors.rate_error = "Exchange Rate cannot be empty";
    } else {
      errors.rate_error = "";
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
  };

  const dateErrors = () => {
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
      if (rate.rate_error) {
        errors.push(rate.rate_error);
      }
    });
    return errors.filter(
      (error, index) =>
        error &&
        error !== "" &&
        (!error.includes("overlaps") || errors.indexOf(error) === index)
    );
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

  const datesOverlap = (start1, end1, start2, end2) => {
    const s1 = new Date(start1).getTime();
    const e1 = new Date(end1).getTime();
    const s2 = new Date(start2).getTime();
    const e2 = new Date(end2).getTime();

    return s1 <= e2 && s2 <= e1;
  };

  const validateOverlap = (currentRate, discountRates) => {
    let overlapError = "";

    if (currentRate.begin_date && currentRate.end_date) {
      const otherRates = discountRates.filter(
        (rate) => rate.id !== currentRate.id
      );

      for (const rate of otherRates) {
        if (rate.begin_date && rate.end_date) {
          const isOverlapping = datesOverlap(
            currentRate.begin_date,
            currentRate.end_date,
            rate.begin_date,
            rate.end_date
          );

          if (isOverlapping) {
            overlapError = `The selected date range (${formatDate(
              currentRate.begin_date
            )} to ${formatDate(
              currentRate.end_date
            )}) overlaps with an existing discount rate (${formatDate(
              rate.begin_date
            )} to ${formatDate(rate.end_date)})`;
            break;
          }
        }
      }
    }
    return overlapError;
  };

  const handleDateChange = (rateId, dateField, newValue) => {
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

    const discountRates =
      resourceData?.resource_details?.exchange_rates?.discount_rates || [];
    const rate = discountRates.find((r) => r.id === rateId);
    if (!rate) return;

    const changes = { [fieldMap[dateField]]: newValue };
    const errors = {};
    const isEndDate = dateField === "end_date";

    const validateCurrentField = () => {
      if (!newValue) {
        errors[`${dateField}_error`] = "Date cannot be empty or invalid";
        return false;
      }

      const column = exchangeRateColumns.find((col) => col.key === dateField);
      // Get min/max dates from column configuration
      const columnMinDate = column?.minDate || "1900-01-01";
      const columnMaxDate = column?.maxDate || "2100-12-31";
      const effectiveMinDate =
        isEndDate && rate.begin_date ? rate.begin_date : columnMinDate;

      if (newValue < effectiveMinDate) {
        errors[`${dateField}_error`] = `${dateField.replace(
          "_",
          " "
        )} ${formatDate(newValue)} cannot be before ${formatDate(
          effectiveMinDate
        )}`;
        return false;
      }

      if (newValue > columnMaxDate) {
        errors[`${dateField}_error`] = `${dateField.replace(
          "_",
          " "
        )} cannot be after ${formatDate(columnMaxDate)}`;
        return false;
      }

      errors[`${dateField}_error`] = "";
      return true;
    };

    const validateDateRelationship = () => {
      const currentEndDate =
        dateField === "end_date" ? newValue : rate.end_date;

      if (dateField === "start_date" && currentEndDate) {
        if (newValue > currentEndDate) {
          errors.end_date_error = `end date ${formatDate(
            currentEndDate
          )} cannot be before ${formatDate(newValue)}`;
          return false;
        }
        errors.end_date_error = errors.end_date_error || "";
      }

      return true;
    };

    const validateOverlaps = () => {
      console.log("validating overlaps");
      const currentStartDate =
        dateField === "start_date" ? newValue : rate.begin_date;
      const currentEndDate =
        dateField === "end_date" ? newValue : rate.end_date;

      if (currentStartDate && currentEndDate) {
        const overlapError = validateOverlap(
          { ...rate, begin_date: currentStartDate, end_date: currentEndDate },
          discountRates
        );

        errors.start_date_error = overlapError;
        errors.end_date_error = overlapError;
        return !overlapError;
      }
      return true;
    };

    if (!validateCurrentField()) {
      dispatch({
        type: "UPDATE_EXCHANGE_RATE",
        payload: { rateId, changes: { ...changes, ...errors } },
      });
      return;
    }

    validateDateRelationship();
    validateOverlaps();

    if (isEndDate && !rate.begin_date) {
      errors.start_date_error = "Date cannot be empty or invalid";
    } else if (!isEndDate && !rate.end_date) {
      errors.end_date_error = "Date cannot be empty or invalid";
    }

    dispatch({
      type: "UPDATE_EXCHANGE_RATE",
      payload: { rateId, changes: { ...changes, ...errors } },
    });
  };

  const handleAddDiscountRate = () => {
    const discountRates =
      resourceData?.resource_details?.exchange_rates?.discount_rates || [];
    const today_date = new Date();

    // Find the latest end date from existing rates
    let latestEndDate = today_date;
    discountRates.forEach((rate) => {
      if (rate.end_date) {
        const endDate = new Date(rate.end_date);
        if (endDate > latestEndDate) {
          latestEndDate = endDate;
        }
      }
    });

    // Set start date to day after the latest end date
    const startDate = new Date(latestEndDate);
    startDate.setDate(startDate.getDate() + 1);
    const begin_date = startDate.toISOString().split("T")[0];

    // Set end date to 15 days after start date
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 15);
    const end_date = endDate.toISOString().split("T")[0];
    const newRate = {
      id: Date.now(),
      exchange_rate: "1.0",
      begin_date: begin_date,
      end_date: end_date,
      is_new: true,
    };

    dispatch({
      type: "ADD_EXCHANGE_RATE",
      payload: newRate,
    });
  };

  const exchangeRateRows = () => {
    const exchangeRates = resourceData?.resource_details?.exchange_rates;
    const baseRate = exchangeRates?.base_rate ?? ""; // Default to empty string if no base rate
    const discountRates = exchangeRates?.discount_rates || [];
    const today = new Date().toISOString().split("T")[0];
    const unitType =
      resourceData?.resource_details?.unit_type || "Resource Units";

    const calculateConversion = (rate) => {
      if (!rate || Number(rate) === 0) return "-";
      const unitsPerCredit = 1 / Number(rate);
      return `${unitsPerCredit.toFixed(2)} ${unitType}`;
    };

    return [
      // Base rate row
      {
        rate_type: "Base Rate",
        rate: {
          value: baseRate.toString(),
          onChange: (newValue) => handleBaseRateChange(newValue),
        },
        conversion: calculateConversion(baseRate),
      },
      // Discount rate rows
      ...discountRates.map((rate) => {
        const isRateEditable = rate.is_new || rate.begin_date > today;
        const isStartDateEditable = isRateEditable || rate.begin_date === "";
        const isEndDateEditable =
          rate.is_new || rate.end_date >= today || rate.end_date === "";

        return {
          rate_type: "Discount",
          rate: {
            value: rate.exchange_rate?.toString() || "",
            onChange: isRateEditable
              ? (newValue) => handleRateChange(rate.id, newValue)
              : null,
            disabled: !isRateEditable,
          },
          conversion: calculateConversion(rate.exchange_rate),
          start_date: {
            value: rate.begin_date || "",
            onChange: (newValue) =>
              handleDateChange(rate.id, "start_date", newValue),
            error: rate.start_date_error,
            disabled: !isStartDateEditable,
          },
          end_date: {
            value: rate.end_date || "",
            onChange: (newValue) =>
              handleDateChange(rate.id, "end_date", newValue),
            error: rate.end_date_error,
            disabled: !isEndDateEditable,
          },
          actions: { id: rate.id },
        };
      }),
    ];
  };

  return {
    exchangeRateColumns,
    exchangeRateRows: exchangeRateRows(),
    handleAddDiscountRate,
    handleDeleteRate,
    dateErrors: dateErrors(),
  };
};
