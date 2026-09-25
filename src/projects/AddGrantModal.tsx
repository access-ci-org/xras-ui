import { useMemo } from "react";
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
import { emptyGrant } from "../supporting-grants/empty-grant";
import { grantEditFormSchema } from "../supporting-grants/schema";
import type { SupportingGrantsState } from "../supporting-grants/types";
import Alert from "../shared/Alert";
import {
  copyGrantField,
  editableGrantFields,
  grantFosTypesAtom,
  grantFundingAgenciesAtom,
  type GrantEdits,
} from "./atoms";
import { useRequest } from "./helpers/hooks";

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

function AddGrantForm({
  errors,
  saving,
  onCancel,
  onSave,
}: {
  errors?: string[];
  saving: boolean;
  onCancel: () => void;
  onSave: (values: GrantEdits) => void;
}) {
  // GrantFields reads its select options from the supporting-grants module's
  // atoms, which live in their own store there - see GrantEditModal.tsx.
  const store = useMemo(() => createStore(), []);
  const fundingAgencies = useAtomValue(grantFundingAgenciesAtom);
  const fosTypes = useAtomValue(grantFosTypesAtom);

  const form = useAppForm({
    defaultValues: {
      // GrantFields doesn't read this, but SupportingGrantsState carries it
      // and grantEditFormSchema is shaped to match the submission form's.
      includeSupportingGrants: true,
      grants: [emptyGrant()],
    } as SupportingGrantsState,
    validators: {
      onChange: grantEditFormSchema,
      onSubmit: grantEditFormSchema,
    },
    onSubmit: ({ value }) => {
      const edited = value.grants[0];
      const values: GrantEdits = {};
      // Every field is editable on a not-yet-created grant - there's no
      // persisted isPending to lock grantNumber/isPending against, so
      // editableGrantFields() is called with no argument (see its doc
      // comment in atoms.ts).
      for (const field of editableGrantFields()) copyGrantField(values, edited, field);
      onSave(values);
    },
  });

  return (
    // Same flex-column shape GrantEditModal's form uses, for the same reason:
    // DialogBody only scrolls (rather than clipping the footer) if this form
    // is itself the flex column DialogContent expects.
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
            <GrantFields form={form} index={0} />
          </HydrateAtoms>
        </Provider>
      </DialogBody>

      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Add Grant"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function AddGrantModal({
  grantNumber,
  requestId,
}: {
  grantNumber: string;
  requestId: number;
}) {
  const { request, createGrant, statuses, toggleAddGrantModal } = useRequest(requestId, grantNumber);

  const open = !!request?.showAddGrantModal;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && toggleAddGrantModal()}>
      <DialogContent className="max-w-[1140px]">
        <DialogHeader>
          <DialogTitle>Add Supporting Grant</DialogTitle>
        </DialogHeader>
        {open && request ? (
          <AddGrantForm
            errors={request.grantsErrors}
            saving={request.grantsStatus == statuses.pending}
            onCancel={() => toggleAddGrantModal()}
            onSave={(values) => createGrant(values)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
