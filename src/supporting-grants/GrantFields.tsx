import { useState } from "react";
import { useAtomValue } from "jotai";
import { useStore } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AppForm } from "@/components/form";
import { fosTypesAtom, fundingAgenciesAtom } from "./atoms";
import { formatAsCurrency } from "./currency";
import { fetchNSFGrantDetails, nsfDateToIso } from "./nsf-lookup";
import type { GrantFieldName, SupportingGrantsState } from "./types";

interface GrantFieldsProps {
  form: AppForm<SupportingGrantsState>;
  index: number;
  onRemove: () => void;
}

export function GrantFields({ form, index, onRemove }: GrantFieldsProps) {
  const fundingAgencies = useAtomValue(fundingAgenciesAtom);
  const fosTypes = useAtomValue(fosTypesAtom);

  // Subscribed rather than read through form.getFieldValue(), which doesn't
  // subscribe — the input mask, character limit, and award-search link all
  // depend on this and have to recompute when the agency changes.
  const fundingAgencyId = useStore(
    form.store,
    (state) => state.values.grants[index]?.fundingAgencyId,
  );

  const isNSF =
    fundingAgencies.find(
      (agency) => String(agency.id) === String(fundingAgencyId),
    )?.abbr === "NSF";

  const [nsfLookupStatus, setNsfLookupStatus] = useState<
    "idle" | "pending" | "error"
  >("idle");

  async function handleGrantNumberBlur() {
    setNsfLookupStatus("idle");

    const grant = form.getFieldValue(`grants[${index}]`);
    const fundingAgency = fundingAgencies.find(
      (agency) => String(agency.id) === String(grant.fundingAgencyId),
    );
    if (fundingAgency?.abbr !== "NSF") return;

    // NSF award numbers are exactly 7 digits, so anything shorter is a
    // half-typed number — looking it up would only 404 and flash an error at
    // someone who is still typing.
    const grantNumber = grant.grantNumber.replace(/[^0-9]+/g, "");
    if (!/^\d{7}$/.test(grantNumber)) return;

    setNsfLookupStatus("pending");
    const details = await fetchNSFGrantDetails(grantNumber);
    if (!details) {
      setNsfLookupStatus("error");
      return;
    }
    setNsfLookupStatus("idle");

    const {
      title,
      pdPIName,
      startDate,
      expDate,
      fundsObligatedAmt,
      poName,
      poEmail,
    } = details;

    const setIfEmpty = (field: GrantFieldName, value: string | undefined) => {
      if (!value) return;
      const current = form.getFieldValue(`grants[${index}].${field}`);
      if (typeof current === "string" && current.length > 0) return;
      form.setFieldValue(`grants[${index}].${field}`, value);
    };

    setIfEmpty("title", title);
    setIfEmpty("piName", pdPIName);
    setIfEmpty("beginDate", startDate ? nsfDateToIso(startDate) : undefined);
    setIfEmpty("endDate", expDate ? nsfDateToIso(expDate) : undefined);
    setIfEmpty(
      "awardedAmount",
      fundsObligatedAmt ? formatAsCurrency(fundsObligatedAmt) : undefined,
    );
    setIfEmpty("programOfficerName", poName);
    setIfEmpty("programOfficerEmail", poEmail);
  }

  return (
    <div className="supporting-grant border border-input p-4 space-y-2">
      <div className="grid grid-cols-1 gap-4">
        <form.AppField name={`grants[${index}].isPending`}>
          {(field) => (
            <field.FieldRadio
              required
              label="Is this grant pending?"
              options={[
                { value: true, label: "Yes" },
                { value: false, label: "No" },
              ]}
            />
          )}
        </form.AppField>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <form.AppField
          name={`grants[${index}].fundingAgencyId`}
          listeners={{
            onChange: ({ value }) => {
              const nowNSF =
                fundingAgencies.find((a) => String(a.id) === String(value))
                  ?.abbr === "NSF";
              if (!nowNSF) return;
              const current =
                form.getFieldValue(`grants[${index}].grantNumber`) ?? "";
              // Masking a number issued by another agency down to 7 digits
              // would fabricate a plausible NSF award number, which the blur
              // lookup would then happily resolve to someone else's grant.
              // Anything that isn't already a valid NSF number gets cleared
              // instead. Switching away from NSF needs no cleanup, since any
              // string within the length limit is valid for other agencies.
              if (current && !/^\d{7}$/.test(current)) {
                form.setFieldValue(`grants[${index}].grantNumber`, "");
              }
            },
          }}
        >
          {(field) => (
            <field.FieldSelect
              label="Funding Agency"
              required
              placeholder="Select a funding agency"
              options={fundingAgencies.map((agency) => ({
                value: String(agency.id),
                label: agency.name,
              }))}
            />
          )}
        </form.AppField>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <form.AppField name={`grants[${index}].title`}>
          {(field) => <field.FieldInput label="Grant Title" required />}
        </form.AppField>

        <form.AppField name={`grants[${index}].piName`}>
          {(field) => <field.FieldInput label="PI Name" required />}
        </form.AppField>
      </div>

      {/* Required whether or not the grant is pending, so it has to stay
          outside the conditional block below — otherwise answering "Yes,
          pending" leaves the form invalid with an error on a field that
          isn't on screen, and element.tsx blocks submit with nothing for
          the user to fix. */}
      <div className="grid grid-cols-1 gap-4">
        <form.AppField name={`grants[${index}].primaryFosTypeId`}>
          {(field) => (
            <field.FieldSelect
              label="Field of Science"
              required
              placeholder="-- Please select one --"
              options={fosTypes.map((fos) => ({
                value: String(fos.id),
                label: fos.name,
              }))}
            />
          )}
        </form.AppField>
      </div>

      <form.Subscribe
        selector={(state) => state.values.grants[index]?.isPending === false}
      >
        {(requireAwardDetails) =>
          requireAwardDetails ? (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <form.AppField name={`grants[${index}].grantNumber`}>
                  {(field) => (
                    <div>
                      <field.FieldInput
                        label="Grant Number"
                        required
                        // maxLength is the native guard; transformValue is what
                        // actually enforces the limit, since it also covers
                        // paste and programmatic changes.
                        maxLength={isNSF ? 7 : 40}
                        transformValue={(raw) =>
                          isNSF
                            ? raw.replace(/\D/g, "").slice(0, 7)
                            : raw.slice(0, 40)
                        }
                        onBlur={() => void handleGrantNumberBlur()}
                        adornment={
                          nsfLookupStatus === "pending" ? (
                            <Loader2 className="size-4 animate-spin text-muted-foreground" />
                          ) : null
                        }
                        description={
                          isNSF ? (
                            <>
                              Award information is filled in automatically once
                              the grant number is entered.{" "}
                              <a
                                href="https://www.nsf.gov/awardsearch/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline"
                              >
                                Look up an NSF grant number
                              </a>
                              .
                            </>
                          ) : null
                        }
                      />
                      {nsfLookupStatus === "error" ? (
                        <p className="text-sm text-destructive">
                          Could not find an NSF grant with this number.
                        </p>
                      ) : null}
                    </div>
                  )}
                </form.AppField>

                <form.AppField name={`grants[${index}].beginDate`}>
                  {(field) => (
                    <field.FieldDatePicker label="Start Date" required />
                  )}
                </form.AppField>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <form.AppField name={`grants[${index}].endDate`}>
                  {(field) => (
                    <field.FieldDatePicker label="End Date" required />
                  )}
                </form.AppField>

                <form.AppField name={`grants[${index}].awardedAmount`}>
                  {(field) => (
                    <field.FieldInput
                      label="Awarded Amount"
                      required
                      placeholder="Enter awarded amount"
                      onBlur={(e) =>
                        field.handleChange(formatAsCurrency(e.target.value))
                      }
                    />
                  )}
                </form.AppField>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <form.AppField name={`grants[${index}].programOfficerName`}>
                  {(field) => (
                    <field.FieldInput
                      label="Program Officer Name"
                      required
                      placeholder="Enter program officer name"
                    />
                  )}
                </form.AppField>

                <form.AppField name={`grants[${index}].programOfficerEmail`}>
                  {(field) => (
                    <field.FieldInput
                      label="Program Officer Email"
                      required
                      placeholder="Enter valid email"
                    />
                  )}
                </form.AppField>
              </div>
            </>
          ) : null
        }
      </form.Subscribe>

      <form.AppField name={`grants[${index}].comments`}>
        {(field) => (
          <field.FieldTextarea
            label="Explanation"
            description="Please explain how this supporting grant is related to your project. If the grant supports more than one ACCESS project, explain how your work is different from the existing projects."
            required
            rows={4}
            placeholder="Enter your explanation"
          />
        )}
      </form.AppField>

      <Button type="button" variant="destructive" onClick={onRemove}>
        Remove
      </Button>
    </div>
  );
}
