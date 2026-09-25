import { useMemo, useState } from "react";
import { Provider, createStore, useAtomValue, type WritableAtom } from "jotai";
import { useHydrateAtoms } from "jotai/utils";

import { useAppForm } from "@/components/form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GrantFields } from "../supporting-grants/GrantFields";
import { fosTypesAtom, fundingAgenciesAtom } from "../supporting-grants/atoms";
import { AWARDED_UNITS, formatAsCurrency } from "../supporting-grants/currency";
import { grantEditFormSchema } from "../supporting-grants/schema";
import type {
  FosType,
  FundingAgency,
  SupportingGrant,
  SupportingGrantsState,
} from "../supporting-grants/types";
import Alert from "../shared/Alert";
import { formatDate } from "../shared/helpers/utils";
import {
  ALL_GRANT_FIELDS,
  copyGrantField,
  editableGrantFields,
  grantFosTypesAtom,
  grantFundingAgenciesAtom,
  type GrantEdits,
} from "./atoms";
import { useRequest } from "./helpers/hooks";
import type { Grant, Request } from "./types";

/**
 * A *warning*, not a blocking error: the request's own dates aren't always
 * reliable evidence (a request with no approved allocation yet has none at
 * all), and xras_api's dates_overlap_request_allocation_dates is the actual
 * authority. This exists only to catch an obvious mismatch before the user
 * finds out from a failed save.
 */
const overlapWarning = (
  beginDate: string,
  endDate: string,
  request: Request,
): string | null => {
  if (!beginDate || !endDate || !request.startDate || !request.endDate) return null;
  if (endDate < request.startDate || beginDate > request.endDate)
    return `These dates do not overlap the project's allocation period (${formatDate(
      request.startDate,
    )} to ${formatDate(request.endDate)}).`;
  return null;
};

/**
 * The projects payload's grant, in the shape GrantFields' form works in.
 * Nulls become empty strings because every text field in SupportingGrant is a
 * plain `string` - the API's "no value" and an emptied input are the same
 * thing to the form, and saveGrantAtom normalizes both sides again when it
 * diffs.
 */
const toSupportingGrant = (grant: Grant): SupportingGrant => ({
  id: grant.grantId,
  fundingAgencyId: grant.fundingAgencyId ?? null,
  grantNumber: grant.grantNumber ?? "",
  isPending: grant.isPending ?? null,
  title: grant.title ?? "",
  piName: grant.piName ?? "",
  beginDate: grant.beginDate ?? "",
  endDate: grant.endDate ?? "",
  primaryFosTypeId: grant.primaryFosTypeId ?? null,
  awardedAmount: formatAsCurrency(grant.awardedAmount),
  awardedUnits: grant.awardedUnits ?? AWARDED_UNITS,
  programOfficerName: grant.programOfficerName ?? "",
  programOfficerEmail: grant.programOfficerEmail ?? "",
  comments: grant.comments ?? "",
});

function HydrateAtoms({
  values,
  children,
}: {
  values: Map<WritableAtom<any, any[], any>, unknown>;
  children: React.ReactNode;
}) {
  useHydrateAtoms(values);
  return <>{children}</>;
}

function GrantEditForm({
  grant,
  request,
  errors,
  saving,
  fundingAgencies,
  fosTypes,
  onCancel,
  onSave,
  onNotAwarded,
}: {
  grant: Grant;
  request: Request;
  errors?: string[];
  saving: boolean;
  fundingAgencies: FundingAgency[];
  fosTypes: FosType[];
  onCancel: () => void;
  onSave: (values: GrantEdits) => void;
  onNotAwarded: () => void;
}) {
  // GrantFields reads its select options from the supporting-grants module's
  // atoms, which live in their own store there. Scoping a store to just those
  // children leaves the surrounding My Projects atoms reachable from the rest
  // of the modal.
  const store = useMemo(() => createStore(), []);
  const [confirmingNotAwarded, setConfirmingNotAwarded] = useState(false);

  // Locked fields are derived from the grant's *persisted* isPending, not the
  // form's in-progress one - a user who flips the "Is this grant pending?"
  // radio can't unlock grantNumber/isPending for themselves mid-edit; the
  // server enforces the same allowlist against the stored grant regardless.
  const disabledFields = ALL_GRANT_FIELDS.filter(
    (field) => !editableGrantFields(grant).includes(field),
  );

  const form = useAppForm({
    defaultValues: {
      // GrantFields doesn't read this, but SupportingGrantsState carries it
      // and grantEditFormSchema is shaped to match the submission form's.
      includeSupportingGrants: true,
      grants: [toSupportingGrant(grant)],
    } as SupportingGrantsState,
    validators: {
      onChange: grantEditFormSchema,
      onSubmit: grantEditFormSchema,
    },
    onSubmit: ({ value }) => {
      const edited = value.grants[0];
      const values: GrantEdits = {};
      for (const field of editableGrantFields(grant)) copyGrantField(values, edited, field);
      onSave(values);
    },
  });

  return (
    // The form has to be the flex column DialogContent expects its own
    // children to be (same as publications/PublicationForm.tsx), or DialogBody
    // never scrolls and DialogContent's overflow-hidden clips the footer -
    // and with it the Save button - once the fields are taller than the
    // dialog.
    <form
      className="flex min-h-0 grow flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
    >
      <DialogBody>
        {errors && errors.length > 0 ? (
          <Alert color="danger">
            Sorry, your changes could not be saved.
            <ul className="mb-0">
              {errors.map((message, index) => (
                <li key={index}>{message}</li>
              ))}
            </ul>
          </Alert>
        ) : null}

        <Provider store={store}>
          <HydrateAtoms
            values={
              new Map<WritableAtom<any, any[], any>, unknown>([
                [fundingAgenciesAtom, fundingAgencies],
                [fosTypesAtom, fosTypes],
              ])
            }
          >
            {/* applyNsfLock is left at its default, which is on: My Projects
                always applies the NSF lock. */}
            <GrantFields form={form} index={0} disabledFields={disabledFields} />
          </HydrateAtoms>
        </Provider>

        <form.Subscribe
          selector={(state) => [
            state.values.grants[0]?.beginDate ?? "",
            state.values.grants[0]?.endDate ?? "",
          ]}
        >
          {([beginDate, endDate]) => {
            const warning = overlapWarning(beginDate, endDate, request);
            return warning ? (
              <div className="mt-2">
                <Alert color="warning">{warning}</Alert>
              </div>
            ) : null;
          }}
        </form.Subscribe>

        {/* Only offered while the grant is still awaiting an award decision -
            once it's awarded there's nothing to walk back (see
            editableGrantFields/GRANT_AWARDED_LOCKED_FIELDS). */}
        {grant.isPending === true ? (
          <div className="mt-4 border-t pt-4">
            {confirmingNotAwarded ? (
              <Alert color="warning">
                <p>
                  Are you sure this grant was never awarded? It will be
                  removed from this request, and this can&apos;t be undone.
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={saving}
                    onClick={onNotAwarded}
                  >
                    {saving ? "Saving..." : "Yes, Grant Was Not Awarded"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={saving}
                    onClick={() => setConfirmingNotAwarded(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </Alert>
            ) : (
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => setConfirmingNotAwarded(true)}
              >
                Grant Was Not Awarded
              </Button>
            )}
          </div>
        ) : null}
      </DialogBody>

      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function GrantEditModal({
  grantNumber,
  requestId,
}: {
  grantNumber: string;
  requestId: number;
}) {
  const { request, closeGrantModal, notAwarded, saveGrant, statuses } = useRequest(
    requestId,
    grantNumber,
  );
  const fundingAgencies = useAtomValue(grantFundingAgenciesAtom);
  const fosTypes = useAtomValue(grantFosTypesAtom);

  const grant = request?.grants?.find((g) => g.grantId == request.editGrantId);

  return (
    <Dialog open={!!grant} onOpenChange={(open) => !open && closeGrantModal()}>
      <DialogContent className="max-w-[1140px]">
        <DialogHeader>
          <DialogTitle>
            Edit Supporting Grant{grant?.grantNumber ? ` ${grant.grantNumber}` : ""}
          </DialogTitle>
        </DialogHeader>
        {grant && request ? (
          // Keyed so switching to a different grant rebuilds the form from
          // that grant's values instead of keeping the previous one's.
          <GrantEditForm
            key={grant.grantId}
            grant={grant}
            request={request}
            errors={request.grantsErrors}
            saving={request.grantsStatus == statuses.pending}
            fundingAgencies={fundingAgencies}
            fosTypes={fosTypes}
            onCancel={() => closeGrantModal()}
            onSave={(values) => saveGrant(grant.grantId, values)}
            onNotAwarded={() => notAwarded(grant.grantId)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
