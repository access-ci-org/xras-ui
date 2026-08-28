import { useEffect, useMemo } from "react";
import { Provider, createStore, type WritableAtom } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import { useStore } from "@tanstack/react-form";
import { useAppForm } from "@/components/form";
import { Button } from "@/components/ui/button";
import { GrantFields } from "./GrantFields";
import { fosTypesAtom, fundingAgenciesAtom } from "./atoms";
import { AWARDED_UNITS, formatAsCurrency } from "./currency";
import { parseInitialGrants } from "./parse-initial-grants";
import { supportingGrantsFormSchema } from "./schema";
import type {
  SupportingGrant,
  SupportingGrantsProps,
  SupportingGrantsState,
} from "./types";

function emptyGrant(): SupportingGrant {
  return {
    fundingAgencyId: null,
    grantNumber: "",
    isPending: null,
    title: "",
    piName: "",
    beginDate: "",
    endDate: "",
    primaryFosTypeId: null,
    awardedAmount: "",
    awardedUnits: AWARDED_UNITS,
    programOfficerName: "",
    programOfficerEmail: "",
    comments: "",
  };
}

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

function SupportingGrantsForm({
  initialGrants,
  initialIncludeSupportingGrants,
  onSubmit,
  onChange,
  onValidityChange,
  setExternalSubmit,
}: Pick<
  SupportingGrantsProps,
  | "initialGrants"
  | "initialIncludeSupportingGrants"
  | "onSubmit"
  | "onChange"
  | "onValidityChange"
  | "setExternalSubmit"
>) {
  const form = useAppForm({
    defaultValues: {
      includeSupportingGrants: initialIncludeSupportingGrants ?? null,
      grants: parseInitialGrants(initialGrants).map((grant) => ({
        ...grant,
        awardedAmount: formatAsCurrency(grant.awardedAmount),
      })),
    } as SupportingGrantsState,
    validators: {
      // onMount + onChange (not just onSubmit) keep isValid continuously
      // accurate from the very first render, which the form-associated
      // custom element wrapper (element.tsx) relies on to gate the
      // ancestor <form>'s native submit via ElementInternals.setValidity —
      // nothing there ever calls handleSubmit(), so submit-only validation
      // would never run, and onChange alone wouldn't cover an initial
      // submit attempt before any field has changed.
      onMount: supportingGrantsFormSchema,
      onChange: supportingGrantsFormSchema,
      onSubmit: supportingGrantsFormSchema,
    },
    onSubmit: ({ value }) => {
      onSubmit?.(value.grants);
    },
  });

  const isValid = useStore(form.store, (state) => state.isValid);
  const grants = useStore(form.store, (state) => state.values.grants);
  const includeSupportingGrants = useStore(
    form.store,
    (state) => state.values.includeSupportingGrants,
  );

  useEffect(() => {
    onValidityChange?.(isValid);
  }, [isValid, onValidityChange]);

  useEffect(() => {
    onChange?.({ grants, includeSupportingGrants });
  }, [grants, includeSupportingGrants, onChange]);

  useEffect(() => {
    if (!setExternalSubmit) return;

    if (!isValid) {
      setExternalSubmit(null);
      return;
    }

    setExternalSubmit(async () => {
      // handleSubmit() skips re-running the schema if it thinks the
      // form is already invalid from a prior attempt, which leaves
      // stale errors in place even after the underlying issue is
      // fixed. Force a fresh full validation first so it sees the
      // form's true current state.
      await form.validate("submit");
      await form.handleSubmit();
    });

    return () => setExternalSubmit(null);
  }, [form, isValid, setExternalSubmit]);

  return (
    <div className="supporting-grants-section">
      <div className="mb-4">
        <form.AppField
          name="includeSupportingGrants"
          listeners={{
            // Answering "Yes" with nothing to fill in should open the first
            // grant's fields straight away.
            onChange: ({ value }) => {
              if (value && form.getFieldValue("grants").length === 0) {
                form.pushFieldValue("grants", emptyGrant());
              }
            },
          }}
        >
          {(field) => (
            <field.FieldRadio
              required
              label="Does this request include supporting grants?"
              options={[
                { value: true, label: "Yes" },
                { value: false, label: "No" },
              ]}
            />
          )}
        </form.AppField>
      </div>

      {includeSupportingGrants && (
        <form.Field name="grants" mode="array">
          {(grantsField) => (
            <div className="flex flex-col gap-4">
              {grantsField.state.value.map((_, index) => (
                <GrantFields
                  key={index}
                  form={form}
                  index={index}
                  onRemove={() => grantsField.removeValue(index)}
                />
              ))}
              <Button
                type="button"
                onClick={() => grantsField.pushValue(emptyGrant())}
              >
                Add another supporting grant
              </Button>
            </div>
          )}
        </form.Field>
      )}
    </div>
  );
}

export function SupportingGrantsSection(
  props: Omit<SupportingGrantsProps, "target">,
) {
  const store = useMemo(() => createStore(), []);

  return (
    <Provider store={store}>
      <HydrateAtoms
        values={
          new Map<WritableAtom<any, any[], any>, unknown>([
            [fundingAgenciesAtom, props.fundingAgencies],
            [fosTypesAtom, props.fosTypes],
          ])
        }
      >
        <SupportingGrantsForm
          initialGrants={props.initialGrants}
          initialIncludeSupportingGrants={props.initialIncludeSupportingGrants}
          onSubmit={props.onSubmit}
          onChange={props.onChange}
          onValidityChange={props.onValidityChange}
          setExternalSubmit={props.setExternalSubmit}
        />
      </HydrateAtoms>
    </Provider>
  );
}
