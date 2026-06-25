import { useMemo } from "react";
import { Provider, createStore, useAtom, type WritableAtom } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import { useAppForm } from "@/components/form";
import { RadioGroupOptions } from "@/components/form/field-wrapper";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { GrantFields } from "./GrantFields";
import {
  fosTypesAtom,
  fundingAgenciesAtom,
  includeSupportingGrantsAtom,
} from "./atoms";
import { supportingGrantsFormSchema } from "./schema";
import type { SupportingGrant, SupportingGrantsProps } from "./types";

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
    awardedUnits: "Dollars",
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
  onSubmit,
}: Pick<SupportingGrantsProps, "initialGrants" | "onSubmit">) {
  const [includeSupportingGrants, setIncludeSupportingGrants] = useAtom(
    includeSupportingGrantsAtom,
  );

  const form = useAppForm({
    defaultValues: { grants: initialGrants ?? [] } as {
      grants: SupportingGrant[];
    },
    validators: {
      onSubmit: supportingGrantsFormSchema,
    },
    onSubmit: ({ value }) => {
      onSubmit?.(value.grants);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void (async () => {
          // handleSubmit() skips re-running the schema if it thinks the
          // form is already invalid from a prior attempt, which leaves
          // stale errors in place even after the underlying issue is
          // fixed. Force a fresh full validation first so it sees the
          // form's true current state.
          await form.validate("submit");
          await form.handleSubmit();
        })();
      }}
      className="supporting-grants-section"
    >
      <div className="mb-4">
        <Label>Does this request include supporting grants?</Label>
        <RadioGroupOptions
          name="include-supporting-grants"
          value={
            includeSupportingGrants === true
              ? "true"
              : includeSupportingGrants === false
                ? "false"
                : ""
          }
          onValueChange={(value) => {
            const include = value === "true";
            setIncludeSupportingGrants(include);
            if (include && form.getFieldValue("grants").length === 0) {
              form.pushFieldValue("grants", emptyGrant());
            }
          }}
          options={[
            { value: "true", label: "Yes" },
            { value: "false", label: "No" },
          ]}
        />
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

      <div className="mt-4">
        <form.AppForm>
          <form.SubscribeButton label="Submit" />
        </form.AppForm>
      </div>
    </form>
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
            [
              includeSupportingGrantsAtom,
              props.initialIncludeSupportingGrants ?? null,
            ],
          ])
        }
      >
        <SupportingGrantsForm
          initialGrants={props.initialGrants}
          onSubmit={props.onSubmit}
        />
      </HydrateAtoms>
    </Provider>
  );
}
