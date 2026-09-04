import { z } from "zod";

import { parseCurrencyAmount } from "./currency";
import type { FundingAgency, SupportingGrant } from "./types";

const REQUIRED_MESSAGE = "This field is required";
const EMAIL_MESSAGE = "Enter a valid email";

const emailSchema = z.email();

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

export function createSupportingGrantSchema(
  fundingAgencies: FundingAgency[],
) {
  return z
    .object({
      id: z.union([z.string(), z.number()]).optional(),
      fundingAgencyId: requiredIdSchema,
      grantNumber: z.string(),
      isPending: z.boolean().nullable(),
      title: requiredTextSchema,
      piName: requiredTextSchema,
      beginDate: z.string(),
      endDate: z.string(),
      primaryFosTypeId: requiredIdSchema,
      awardedAmount: z.string(),
      awardedUnits: z.string(),
      programOfficerName: z.string(),
      // Checked in the superRefine below rather than as z.email() here.
      // A constraint in the object shape runs on every parse, and a pending
      // grant doesn't render this field — so a blank (or leftover malformed)
      // value would fail off-screen and block submit with nothing to fix.
      programOfficerEmail: z.string(),
      comments: requiredTextSchema,
      _destroy: z.boolean().optional(),
    })
    .superRefine((grant, ctx) => {
      if (grant.isPending === null) {
        addRequiredIssue(ctx, "isPending");
      }

      if (grant.grantNumber.length > 40) {
        ctx.addIssue({
          code: "custom",
          message: "Grant number must be 40 characters or fewer",
          path: ["grantNumber"],
        });
      }

      if (grant.isPending === false) {
        if (!grant.grantNumber.trim()) {
          addRequiredIssue(ctx, "grantNumber");
        }

        const fundingAgency = fundingAgencies.find(
          (agency) =>
            String(agency.id) === String(grant.fundingAgencyId),
        );

        if (
          fundingAgency?.abbr === "NSF" &&
          !/^\d{7}$/.test(grant.grantNumber)
        ) {
          ctx.addIssue({
            code: "custom",
            message: "NSF grant number must be exactly 7 digits",
            path: ["grantNumber"],
          });
        }

        if (!grant.beginDate.trim()) {
          addRequiredIssue(ctx, "beginDate");
        }

        if (!grant.endDate.trim()) {
          addRequiredIssue(ctx, "endDate");
        }

        if (!grant.awardedAmount.trim()) {
          addRequiredIssue(ctx, "awardedAmount");
        } else if (
          !Number.isFinite(parseCurrencyAmount(grant.awardedAmount))
        ) {
          ctx.addIssue({
            code: "custom",
            message: "Enter a valid amount",
            path: ["awardedAmount"],
          });
        }

        if (!grant.programOfficerName.trim()) {
          addRequiredIssue(ctx, "programOfficerName");
        }

        if (!grant.programOfficerEmail.trim()) {
          addRequiredIssue(ctx, "programOfficerEmail");
        } else if (!emailSchema.safeParse(grant.programOfficerEmail).success) {
          ctx.addIssue({
            code: "custom",
            message: EMAIL_MESSAGE,
            path: ["programOfficerEmail"],
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
}

export function createSupportingGrantsFormSchema(
  fundingAgencies: FundingAgency[],
) {
  const grantSchema = createSupportingGrantSchema(fundingAgencies);

  return z
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

      const liveGrants = value.grants.filter((grant) => !grant._destroy);
      if (liveGrants.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Add at least one supporting grant, or answer No above.",
          path: ["includeSupportingGrants"],
        });
      }
      
      value.grants.forEach((grant, index) => {
        if (grant._destroy) return;
          const result = grantSchema.safeParse(grant);
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
}
