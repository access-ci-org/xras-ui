import { useCallback, useEffect, useRef, useState } from "react";
import { useAtomValue } from "jotai";
import { useStore } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AppForm } from "@/components/form";
import Alert from "../shared/Alert";
import { fosTypesAtom, fundingAgenciesAtom } from "./atoms";
import { formatAsCurrency } from "./currency";
import {
  fetchNSFGrantDetails,
  nsfDateToIso,
  type NSFAwardDetails,
} from "./nsf-lookup";
import type {
  FundingAgency,
  GrantFieldName,
  GrantFormFieldName,
  SupportingGrantsState,
} from "./types";

// Once the lock engages, every field except Field of Science and Explanation
// is expected to come from NSF's own award record rather than be edited
// alongside it. Distinct from the server's own locked-field set
// (GRANT_AWARDED_LOCKED_FIELDS in save_grants) - this restriction is UI-only.
//
// These identify the record itself, so they lock unconditionally.
const NSF_LOCKED_FIELDS: readonly GrantFormFieldName[] = [
  "fundingAgencyId",
  "grantNumber",
  "isPending",
];

// These are filled in from the record, each in the form's own format, and
// lock only where the record actually has a value. NSF's award records aren't
// always complete - a missing program officer email is the usual gap - and
// every one of these fields is required, so locking one empty would leave the
// grant impossible to save.
const NSF_FILLED_FIELDS: Partial<
  Record<GrantFieldName, (award: NSFAwardDetails) => string | undefined>
> = {
  title: (award) => award.title,
  piName: (award) => award.pdPIName,
  beginDate: (award) =>
    award.startDate ? nsfDateToIso(award.startDate) : undefined,
  endDate: (award) => (award.expDate ? nsfDateToIso(award.expDate) : undefined),
  awardedAmount: (award) =>
    award.fundsObligatedAmt
      ? formatAsCurrency(award.fundsObligatedAmt)
      : undefined,
  programOfficerName: (award) => award.poName,
  programOfficerEmail: (award) => award.poEmail,
};

const nsfValueFor = (
  field: GrantFormFieldName,
  award: NSFAwardDetails,
): string | undefined =>
  NSF_FILLED_FIELDS[field as GrantFieldName]?.(award) || undefined;

const isNsfAgency = (
  fundingAgencyId: unknown,
  agencies: FundingAgency[],
): boolean =>
  agencies.find((agency) => String(agency.id) === String(fundingAgencyId))
    ?.abbr === "NSF";

// The lock engages only once NSF's own award database answers for the grant
// number, because the record it returns is the entire justification for taking
// the fields away. A number NSF doesn't recognise - a typo, most of the time -
// has no record behind it to defer to, and locking on one would disable the
// grant number field itself, trapping the user with a wrong number they can no
// longer correct. Resolves to the record the lock rests on, or null for no
// lock.
async function nsfLockingAward(
  fundingAgencyId: unknown,
  grantNumber: unknown,
  agencies: FundingAgency[],
): Promise<NSFAwardDetails | null> {
  if (!isNsfAgency(fundingAgencyId, agencies)) return null;
  if (typeof grantNumber !== "string") return null;
  const digits = grantNumber.replace(/[^0-9]+/g, "");
  if (!digits) return null;
  try {
    return await fetchNSFGrantDetails(digits);
  } catch {
    // research.gov being unreachable says nothing about the grant, so leave
    // the fields editable rather than lock on an infrastructure failure.
    return null;
  }
}

interface GrantFieldsProps {
  form: AppForm<SupportingGrantsState>;
  index: number;
  /**
   * Fields to render read-only. My Projects reuses this whole form to edit an
   * already-submitted grant, where only a subset of fields may change once a
   * grant has been awarded (see editableGrantFields() in projects/atoms.ts);
   * the submission form leaves this empty and everything stays editable.
   */
  disabledFields?: readonly GrantFormFieldName[];
  /**
   * Once the funding agency is NSF and NSF's award database recognises the
   * grant number, locks every field except Field of Science and Explanation
   * (see NSF_LOCKED_FIELDS and NSF_FILLED_FIELDS) so nobody can contradict
   * what NSF's own award record says - except the fields that record has no
   * value for, which the user would otherwise have no way to fill in. There
   * is no server-side equivalent of this restriction,
   * which is why it can be turned off: it's on by default, and only a client
   * embedding these fields itself has any reason to opt out. Decided only on
   * mount, when the funding agency changes, and when the grant number is
   * blurred - never on every keystroke - so it can't fight the user while
   * they're mid-edit.
   */
  applyNsfLock?: boolean;
  /** Omitted where grants can't be removed, which hides the Remove button. */
  onRemove?: () => void;
}

export function GrantFields({
  form,
  index,
  disabledFields = [],
  applyNsfLock = true,
  onRemove,
}: GrantFieldsProps) {
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
  // The NSF award record the lock rests on, or null while it isn't engaged.
  const [nsfLockAward, setNsfLockAward] = useState<NSFAwardDetails | null>(null);
  const nsfLocked = nsfLockAward !== null;
  const nsfLeavesFieldsOpen =
    nsfLocked &&
    (Object.keys(NSF_FILLED_FIELDS) as GrantFieldName[]).some(
      (field) => !nsfValueFor(field, nsfLockAward),
    );
  // Only the most recent decision about the lock may stand. Each check claims
  // the next number before it awaits, so a lookup that comes back late can't
  // re-lock a grant number the user has since changed, or unlock one a newer
  // lookup has just confirmed.
  const nsfLockCheck = useRef(0);

  // Deciding the lock takes a request to research.gov, so - unlike the
  // disabledFields the caller hands in - it can't be known at first render.
  // This is the silent form of the lookup: it deliberately leaves
  // nsfLookupStatus alone, since the user didn't ask for it and has no reason
  // to be shown a spinner or a not-found message for it.
  const checkNsfLock = useCallback(
    async (fundingAgencyId: unknown, grantNumber: unknown) => {
      if (!applyNsfLock) return;
      const check = ++nsfLockCheck.current;
      const award = await nsfLockingAward(fundingAgencyId, grantNumber, fundingAgencies);
      if (nsfLockCheck.current === check) setNsfLockAward(award);
    },
    [applyNsfLock, fundingAgencies],
  );

  useEffect(() => {
    // Mount only, and intentionally: an already-submitted NSF grant arrives
    // with its number filled in, which is the case the lock exists for (My
    // Projects' edit modal is nothing else). Afterwards the lock is re-decided
    // by lookUpNsfAward, not by re-running this.
    void checkNsfLock(
      form.getFieldValue(`grants[${index}].fundingAgencyId`),
      form.getFieldValue(`grants[${index}].grantNumber`),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isDisabled = (field: GrantFormFieldName) =>
    disabledFields.includes(field) ||
    (applyNsfLock &&
      nsfLocked &&
      (NSF_LOCKED_FIELDS.includes(field) ||
        nsfValueFor(field, nsfLockAward) !== undefined));

  // The user-facing form of the lookup, run whenever the user supplies one
  // half of what it needs - a grant number (on blur) or the funding agency -
  // with the other already in place. Either order has to autofill: someone
  // who types the number first and picks NSF second has asked for exactly the
  // same thing as someone who does it the other way round.
  async function lookUpNsfAward(fundingAgencyId: unknown, rawGrantNumber: unknown) {
    // The lookup fills in fields from the grant number, so it has nothing to
    // do where the grant number itself is fixed - which includes every case
    // where the lock is already engaged.
    if (isDisabled("grantNumber")) return;

    setNsfLookupStatus("idle");

    // This lookup is the newest word on the lock, so claim a check number for
    // it here rather than calling checkNsfLock and asking NSF about the same
    // grant number twice. Claimed before the early returns below, and before
    // the await, so that a check still in flight over an older grant number
    // or agency can no longer have the last word either way.
    const check = ++nsfLockCheck.current;
    const settleLock = (award: NSFAwardDetails | null) => {
      if (applyNsfLock && nsfLockCheck.current === check) setNsfLockAward(award);
    };

    if (!isNsfAgency(fundingAgencyId, fundingAgencies)) return settleLock(null);

    // NSF award numbers are exactly 7 digits, so anything shorter is a
    // half-typed number — looking it up would only 404 and flash an error at
    // someone who is still typing.
    const grantNumber =
      typeof rawGrantNumber === "string" ? rawGrantNumber.replace(/[^0-9]+/g, "") : "";
    if (!/^\d{7}$/.test(grantNumber)) return settleLock(null);

    setNsfLookupStatus("pending");
    let details: NSFAwardDetails | null;
    try {
      details = await fetchNSFGrantDetails(grantNumber);
    } catch {
      // research.gov being unreachable says nothing about the grant, so it's
      // neither a not-found nor grounds for a lock - see nsfLockingAward.
      setNsfLookupStatus("idle");
      return settleLock(null);
    }
    if (!details) {
      // No record to defer to, so nothing to lock - see nsfLockingAward.
      setNsfLookupStatus("error");
      return settleLock(null);
    }
    setNsfLookupStatus("idle");

    // With the lock on, NSF's record wins outright: the fields are about to
    // become read-only, so anything already typed into them that disagrees
    // with NSF could never be corrected. Without the lock the user keeps the
    // last word, so only empty fields are filled in. Either way a field NSF
    // has no value for is left alone - and, with the lock on, left editable.
    for (const field of Object.keys(NSF_FILLED_FIELDS) as GrantFieldName[]) {
      const value = nsfValueFor(field, details);
      if (!value) continue;
      if (!applyNsfLock) {
        const current = form.getFieldValue(`grants[${index}].${field}`);
        if (typeof current === "string" && current.length > 0) continue;
      }
      form.setFieldValue(`grants[${index}].${field}`, value);
    }

    // NSF answered for this number, which is the whole condition for the
    // lock. Engage it last, so the autofill above is what the user is left
    // looking at in the now read-only fields.
    settleLock(details);
  }

  return (
    <div className="supporting-grant border border-input p-4 space-y-2">
      {applyNsfLock && nsfLocked ? (
        <Alert color="info">
          This grant&apos;s details were populated from NSF&apos;s records and can&apos;t be
          edited
          {nsfLeavesFieldsOpen
            ? ", except for any that NSF's records leave blank."
            : "."}
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-4">
        <form.AppField name={`grants[${index}].isPending`}>
          {(field) => (
            <field.FieldRadio
              required
              disabled={isDisabled("isPending")}
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
              if (nowNSF) {
                // Masking a number issued by another agency down to 7 digits
                // would fabricate a plausible NSF award number, which the blur
                // lookup would then happily resolve to someone else's grant.
                // Anything that isn't already a valid NSF number gets cleared
                // instead. Switching away from NSF needs no cleanup, since any
                // string within the length limit is valid for other agencies.
                const current =
                  form.getFieldValue(`grants[${index}].grantNumber`) ?? "";
                if (current && !/^\d{7}$/.test(current)) {
                  form.setFieldValue(`grants[${index}].grantNumber`, "");
                }
              }
              void lookUpNsfAward(
                value,
                form.getFieldValue(`grants[${index}].grantNumber`),
              );
            },
          }}
        >
          {(field) => (
            <field.FieldSelect
              label="Funding Agency"
              required
              disabled={isDisabled("fundingAgencyId")}
              placeholder="Select a funding agency"
              options={fundingAgencies.map((agency) => ({
                value: String(agency.id),
                label: agency.name,
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
              {/* The grant number comes straight after the funding agency,
                  which decides its format (NSF's 7-digit mask) and drives the
                  NSF lookup. */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <form.AppField name={`grants[${index}].grantNumber`}>
                  {(field) => (
                    <div>
                      <field.FieldInput
                        label="Grant Number"
                        required
                        disabled={isDisabled("grantNumber")}
                        // maxLength is the native guard; transformValue is what
                        // actually enforces the limit, since it also covers
                        // paste and programmatic changes.
                        maxLength={isNSF ? 7 : 40}
                        transformValue={(raw) =>
                          isNSF
                            ? raw.replace(/\D/g, "").slice(0, 7)
                            : raw.slice(0, 40)
                        }
                        onBlur={() =>
                          void lookUpNsfAward(
                            form.getFieldValue(`grants[${index}].fundingAgencyId`),
                            form.getFieldValue(`grants[${index}].grantNumber`),
                          )
                        }
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

                <form.AppField name={`grants[${index}].awardedAmount`}>
                  {(field) => (
                    <field.FieldInput
                      label="Awarded Amount"
                      description="Enter the full amount of the award. If only part of the funds are related to this project, note the portion that is related in the explanation below."
                      required
                      disabled={isDisabled("awardedAmount")}
                      placeholder="Enter awarded amount"
                      onBlur={(e) =>
                        field.handleChange(formatAsCurrency(e.target.value))
                      }
                    />
                  )}
                </form.AppField>
              </div>
            </>
          ) : null
        }
      </form.Subscribe>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <form.AppField name={`grants[${index}].title`}>
          {(field) => (
            <field.FieldInput
              label="Grant Title"
              required
              disabled={isDisabled("title")}
            />
          )}
        </form.AppField>

        <form.AppField name={`grants[${index}].piName`}>
          {(field) => (
            <field.FieldInput
              label="PI Name"
              required
              disabled={isDisabled("piName")}
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
                <form.AppField name={`grants[${index}].beginDate`}>
                  {(field) => (
                    <field.FieldDatePicker
                      label="Start Date"
                      required
                      disabled={isDisabled("beginDate")}
                    />
                  )}
                </form.AppField>

                <form.AppField name={`grants[${index}].endDate`}>
                  {(field) => (
                    <field.FieldDatePicker
                      label="End Date"
                      required
                      disabled={isDisabled("endDate")}
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
                      disabled={isDisabled("programOfficerName")}
                      placeholder="Enter program officer name"
                    />
                  )}
                </form.AppField>

                <form.AppField name={`grants[${index}].programOfficerEmail`}>
                  {(field) => (
                    <field.FieldInput
                      label="Program Officer Email"
                      required
                      disabled={isDisabled("programOfficerEmail")}
                      placeholder="Enter valid email"
                    />
                  )}
                </form.AppField>
              </div>
            </>
          ) : null
        }
      </form.Subscribe>

      {/* Required whether or not the grant is pending, so it has to stay
          outside the conditional blocks above — otherwise answering "Yes,
          pending" leaves the form invalid with an error on a field that
          isn't on screen, and element.tsx blocks submit with nothing for
          the user to fix. */}
      <div className="grid grid-cols-1 gap-4">
        <form.AppField name={`grants[${index}].primaryFosTypeId`}>
          {(field) => (
            <field.FieldSelect
              label="Field of Science"
              required
              disabled={isDisabled("primaryFosTypeId")}
              placeholder="-- Please select one --"
              options={fosTypes.map((fos) => ({
                value: String(fos.id),
                label: fos.name,
              }))}
            />
          )}
        </form.AppField>
      </div>

      <form.AppField name={`grants[${index}].comments`}>
        {(field) => (
          <field.FieldTextarea
            label="Explanation"
            description="Please explain how this supporting grant is related to your project. If the grant supports more than one ACCESS project, explain how your work is different from the existing projects."
            required
            disabled={isDisabled("comments")}
            rows={4}
            placeholder="Enter your explanation"
          />
        )}
      </form.AppField>

      {onRemove ? (
        <Button type="button" variant="destructive" onClick={onRemove}>
          Remove
        </Button>
      ) : null}
    </div>
  );
}
