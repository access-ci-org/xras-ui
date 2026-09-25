import { useCallback, useEffect, useRef, useState } from "react";
import { useAtomValue } from "jotai";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AppForm } from "@/components/form";
import Alert from "../shared/Alert";
import { fosTypesAtom, fundingAgenciesAtom } from "./atoms";
import { formatAsCurrency } from "./currency";
import { fetchNSFGrantDetails, nsfDateToIso } from "./nsf-lookup";
import type {
  FundingAgency,
  GrantFieldName,
  GrantFormFieldName,
  SupportingGrantsState,
} from "./types";

// Every field except Field of Science and Explanation - once the lock
// engages, those are the only two fields left editable (everything else is
// expected to come from NSF's own award record, not be hand-edited alongside
// it). Distinct from the server's own locked-field set
// (GRANT_AWARDED_LOCKED_FIELDS in save_grants) - this restriction is UI-only.
const NSF_LOCKED_FIELDS: readonly GrantFormFieldName[] = [
  "fundingAgencyId",
  "grantNumber",
  "title",
  "piName",
  "isPending",
  "beginDate",
  "endDate",
  "awardedAmount",
  "programOfficerName",
  "programOfficerEmail",
];

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
// longer correct.
async function nsfLockApplies(
  fundingAgencyId: unknown,
  grantNumber: unknown,
  agencies: FundingAgency[],
): Promise<boolean> {
  if (!isNsfAgency(fundingAgencyId, agencies)) return false;
  if (typeof grantNumber !== "string") return false;
  const digits = grantNumber.replace(/[^0-9]+/g, "");
  if (!digits) return false;
  try {
    return Boolean(await fetchNSFGrantDetails(digits));
  } catch {
    // research.gov being unreachable says nothing about the grant, so leave
    // the fields editable rather than lock on an infrastructure failure.
    return false;
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
   * (see NSF_LOCKED_FIELDS) so nobody can contradict what NSF's own award
   * record says. There is no server-side equivalent of this restriction,
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
  const [nsfLookupStatus, setNsfLookupStatus] = useState<
    "idle" | "pending" | "error"
  >("idle");
  const [nsfLocked, setNsfLocked] = useState(false);
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
      const locked = await nsfLockApplies(fundingAgencyId, grantNumber, fundingAgencies);
      if (nsfLockCheck.current === check) setNsfLocked(locked);
    },
    [applyNsfLock, fundingAgencies],
  );

  useEffect(() => {
    // Mount only, and intentionally: an already-submitted NSF grant arrives
    // with its number filled in, which is the case the lock exists for (My
    // Projects' edit modal is nothing else). Afterwards the lock is re-decided
    // by the two handlers below, not by re-running this.
    void checkNsfLock(
      form.getFieldValue(`grants[${index}].fundingAgencyId`),
      form.getFieldValue(`grants[${index}].grantNumber`),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isDisabled = (field: GrantFormFieldName) =>
    disabledFields.includes(field) ||
    (applyNsfLock && nsfLocked && (NSF_LOCKED_FIELDS as readonly string[]).includes(field));

  async function handleGrantNumberBlur() {
    const grant = form.getFieldValue(`grants[${index}]`);
    const fundingAgency = fundingAgencies.find(
      (agency) => String(agency.id) === String(grant.fundingAgencyId),
    );

    // The lookup fills in fields from the grant number, so it has nothing to
    // do where the grant number itself is fixed - which includes every case
    // where the lock is already engaged.
    if (isDisabled("grantNumber")) return;

    setNsfLookupStatus("idle");

    // This blur's own lookup is the newest word on the lock, so claim a check
    // number for it here rather than calling checkNsfLock and asking NSF about
    // the same grant number twice. Claimed before the early returns below, and
    // before the await, so that a silent check still in flight over an older
    // grant number can no longer have the last word either way.
    const check = ++nsfLockCheck.current;

    if (fundingAgency?.abbr !== "NSF") return;

    const grantNumber = grant.grantNumber.replace(/[^0-9]+/g, "");
    if (!grantNumber) return;

    setNsfLookupStatus("pending");
    const details = await fetchNSFGrantDetails(grantNumber);
    if (!details) {
      // No record to defer to, so nothing to lock - see nsfLockApplies.
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

    // If grant information is available from the API, it has already been awarded.
    if (form.getFieldValue(`grants[${index}].isPending`) === null) {
      form.setFieldValue(`grants[${index}].isPending`, false);
    }

    // NSF answered for this number, which is the whole condition for the
    // lock. Engage it last, so the autofill above is what the user is left
    // looking at in the now read-only fields.
    if (applyNsfLock && nsfLockCheck.current === check) setNsfLocked(true);
  }

  return (
    <div className="supporting-grant border border-input p-4 space-y-2">
      {applyNsfLock && nsfLocked ? (
        <Alert color="info">
          This grant&apos;s details were populated from NSF&apos;s records and can&apos;t be
          hand-edited here.
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-4">
        <form.AppField
          name={`grants[${index}].fundingAgencyId`}
          listeners={{
            onChange: ({ value }) => {
              void checkNsfLock(
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <form.AppField name={`grants[${index}].grantNumber`}>
          {(field) => (
            <div className="relative">
              <field.FieldInput
                label="Grant Number"
                required
                disabled={isDisabled("grantNumber")}
                onBlur={() => void handleGrantNumberBlur()}
              />
              {nsfLookupStatus === "pending" ? (
                <Loader2 className="absolute right-2 top-8 size-4 animate-spin text-muted-foreground" />
              ) : null}
              {nsfLookupStatus === "error" ? (
                <p className="text-sm text-destructive">
                  Could not find an NSF grant with this number.
                </p>
              ) : null}
            </div>
          )}
        </form.AppField>

        <form.AppField name={`grants[${index}].title`}>
          {(field) => (
            <field.FieldInput
              label="Grant Title"
              required
              disabled={isDisabled("title")}
            />
          )}
        </form.AppField>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <form.AppField name={`grants[${index}].piName`}>
          {(field) => (
            <field.FieldInput
              label="PI Name"
              required
              disabled={isDisabled("piName")}
            />
          )}
        </form.AppField>

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

      <form.Subscribe
        selector={(state) => state.values.grants[index]?.isPending === false}
      >
        {(requireAwardDetails) => (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <form.AppField name={`grants[${index}].beginDate`}>
                {(field) => (
                  <field.FieldDatePicker
                    label="Start Date"
                    required={requireAwardDetails}
                    disabled={isDisabled("beginDate")}
                  />
                )}
              </form.AppField>

              <form.AppField name={`grants[${index}].endDate`}>
                {(field) => (
                  <field.FieldDatePicker
                    label="End Date"
                    required={requireAwardDetails}
                    disabled={isDisabled("endDate")}
                  />
                )}
              </form.AppField>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

              <form.AppField name={`grants[${index}].awardedAmount`}>
                {(field) => (
                  <field.FieldInput
                    label="Awarded Amount"
                    required={requireAwardDetails}
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
        )}
      </form.Subscribe>

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
