import { z } from "zod";

import { parseCurrencyAmount } from "./currency";
import type { SupportingGrant } from "./types";

const REQUIRED_MESSAGE = "This field is required";

const requiredIdSchema = z
  .union([z.string(), z.number()])
  .nullable()
  .refine((value) => value !== null && value !== "", {
    message: REQUIRED_MESSAGE,
  });

const requiredTextSchema = z.string().trim().min(1, REQUIRED_MESSAGE);

function addRequiredIssue(ctx: z.RefinementCtx, path: string) {
  ctx.addIssue({ code: "custom", message: REQUIRED_MESSAGE, path: [path] });
}

export const supportingGrantSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    fundingAgencyId: requiredIdSchema,
    grantNumber: requiredTextSchema,
    isPending: z.boolean().nullable(),
    title: requiredTextSchema,
    piName: requiredTextSchema,
    beginDate: z.string(),
    endDate: z.string(),
    primaryFosTypeId: requiredIdSchema,
    awardedAmount: z.string(),
    awardedUnits: z.string(),
    programOfficerName: requiredTextSchema,
    programOfficerEmail: requiredTextSchema.pipe(z.email("Enter a valid email")),
    comments: requiredTextSchema,
    _destroy: z.boolean().optional(),
  })
  .superRefine((grant, ctx) => {
    if (grant.isPending === null) {
      addRequiredIssue(ctx, "isPending");
    }

    // Start date, end date, and awarded amount are only required once the
    // grant is no longer pending.
    if (grant.isPending === false) {
      if (!grant.beginDate.trim()) {
        addRequiredIssue(ctx, "beginDate");
      }
      if (!grant.endDate.trim()) {
        addRequiredIssue(ctx, "endDate");
      }
      if (!grant.awardedAmount.trim()) {
        addRequiredIssue(ctx, "awardedAmount");
      } else if (!Number.isFinite(parseCurrencyAmount(grant.awardedAmount))) {
        ctx.addIssue({
          code: "custom",
          message: "Enter a valid amount",
          path: ["awardedAmount"],
        });
      }
    }

    if (
      grant.beginDate.trim() &&
      grant.endDate.trim() &&
      grant.endDate < grant.beginDate
    ) {
      ctx.addIssue({
        code: "custom",
        message: "End date must be on or after the start date",
        path: ["endDate"],
      });
    }
  });

/**
 * The part of supportingGrantSchema that covers the fields My Projects lets a
 * PI/CoPI/Allocation Manager change after submission - the dates, the pending
 * answer, and the program officer (GRANT_EDITABLE_FIELDS in
 * projects/atoms.ts).
 *
 * The read-only fields are deliberately left unvalidated. A grant submitted
 * before a rule existed can violate it in a field the editor can't reach —
 * validating those would report an error the user has no way to fix and block
 * the edit they came to make. Same reasoning as the `includeSupportingGrants`
 * guard in supportingGrantsFormSchema below.
 */
export const editableGrantFieldsSchema = z
  .object({
    isPending: z.boolean().nullable(),
    beginDate: z.string(),
    endDate: z.string(),
    programOfficerName: requiredTextSchema,
    programOfficerEmail: requiredTextSchema.pipe(z.email("Enter a valid email")),
  })
  .superRefine((grant, ctx) => {
    if (grant.isPending === null) {
      addRequiredIssue(ctx, "isPending");
    }

    // Dates are only required once the grant is no longer pending, matching
    // supportingGrantSchema.
    if (grant.isPending === false) {
      if (!grant.beginDate.trim()) {
        addRequiredIssue(ctx, "beginDate");
      }
      if (!grant.endDate.trim()) {
        addRequiredIssue(ctx, "endDate");
      }
    }

    if (
      grant.beginDate.trim() &&
      grant.endDate.trim() &&
      grant.endDate < grant.beginDate
    ) {
      ctx.addIssue({
        code: "custom",
        message: "End date must be on or after the start date",
        path: ["endDate"],
      });
    }
  });

/**
 * Form-level wrapper around editableGrantFieldsSchema, for the single-grant
 * form My Projects' edit modal builds. Shaped like supportingGrantsFormSchema
 * (and issue paths are rewritten the same way) because both drive the same
 * GrantFields component, which addresses its fields as `grants[i].<field>`.
 */
export const grantEditFormSchema = z
  .object({
    includeSupportingGrants: z.boolean().nullable(),
    grants: z.array(z.custom<SupportingGrant>()),
  })
  .superRefine((value, ctx) => {
    value.grants.forEach((grant, index) => {
      const result = editableGrantFieldsSchema.safeParse(grant);
      if (result.success) return;
      for (const issue of result.error.issues) {
        ctx.addIssue({
          code: "custom",
          message: issue.message,
          path: ["grants", index, ...issue.path],
        });
      }
    });
  });

export const supportingGrantsFormSchema = z
  .object({
    includeSupportingGrants: z
      .boolean()
      .nullable()
      .refine((value) => value !== null, { message: REQUIRED_MESSAGE }),
    // Accepted as-is here; each grant is validated conditionally below, so
    // that answering "No" doesn't fail on hidden fields.
    grants: z.array(z.custom<SupportingGrant>()),
  })
  .superRefine((value, ctx) => {
    // Answering "No" keeps whatever grants were already entered in form
    // state, so switching back to "Yes" doesn't lose them — but their
    // fields are unmounted. Validating them anyway would block submission
    // with errors the user has no way to see or fix.
    if (value.includeSupportingGrants !== true) return;

    value.grants.forEach((grant, index) => {
      const result = supportingGrantSchema.safeParse(grant);
      if (result.success) return;
      for (const issue of result.error.issues) {
        ctx.addIssue({
          code: "custom",
          message: issue.message,
          path: ["grants", index, ...issue.path],
        });
      }
    });
  });
