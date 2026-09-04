import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  CircleDollarSign,
  Hourglass,
  Landmark,
  Mail,
  Microscope,
  Pencil,
  User,
} from "lucide-react";

import { cn } from "@/lib/utils";
import InlineButton from "../shared/InlineButton";
import { AWARDED_UNITS, formatAsDollars } from "../supporting-grants/currency";
import { formatDate, formatNumber } from "../shared/helpers/utils";
import type { Grant as GrantType } from "./types";

const formatAwardedAmount = (grant: GrantType): string | null => {
  if (grant.awardedAmount == null) return null;
  // Dollars are formatted as currency but to the nearest whole dollar: cents
  // are noise in a summary, and the edit form's field is where they matter.
  // Anything else is a count of whatever unit the grant names.
  return grant.awardedUnits === AWARDED_UNITS
    ? formatAsDollars(grant.awardedAmount)
    : `${formatNumber(grant.awardedAmount, { decimalPlaces: 0 })}${
        grant.awardedUnits ? ` ${grant.awardedUnits}` : ""
      }`;
};

const formatDateRange = (grant: GrantType): string | null => {
  if (!grant.beginDate && !grant.endDate) return null;
  const begin = grant.beginDate ? formatDate(grant.beginDate) : "?";
  const end = grant.endDate ? formatDate(grant.endDate) : "?";
  return `${begin} – ${end}`;
};

function Tag({
  children,
  icon: Icon,
  title,
}: {
  children: React.ReactNode;
  icon: LucideIcon;
  title?: string;
}) {
  return (
    <li className="mr-4 inline-flex items-center align-bottom text-base" title={title}>
      <Icon className="mr-1 size-4 shrink-0" />
      {children}
    </li>
  );
}

export default function Grant({
  canEdit = false,
  grant,
  last = false,
  onEdit,
}: {
  canEdit?: boolean;
  grant: GrantType;
  last?: boolean;
  onEdit: () => void;
}) {
  const agency = grant.fundingAgencyAbbr || grant.fundingAgencyName;
  const dateRange = formatDateRange(grant);
  const awardedAmount = formatAwardedAmount(grant);

  return (
    // Same row metrics as the publications listing (see publications/
    // Publication.tsx), minus its hanging indent: that exists to indent a
    // citation's continuation lines, which a grant title and a tag row have
    // no equivalent of.
    <div className={cn("mb-2", !last && "border-b")}>
      <div className="px-4 pb-4 pt-2">
        <div className="text-lg font-bold leading-[1.875rem]">
          {grant.title || grant.grantNumber || "Supporting grant"}
          {canEdit && (
            <InlineButton onClick={onEdit} icon={Pencil} title="Edit supporting grant" />
          )}
        </div>
        <ul className="m-0 list-none py-0 pt-2.5">
          {agency && (
            <Tag
              icon={Landmark}
              title={grant.fundingAgencyName ?? undefined}
            >
              {agency}
              {grant.grantNumber ? ` ${grant.grantNumber}` : ""}
            </Tag>
          )}
          {grant.piName && (
            <Tag icon={User} title="Grant PI">
              {grant.piName}
            </Tag>
          )}
          {grant.isPending ? (
            <Tag icon={Hourglass}>Pending</Tag>
          ) : (
            dateRange && (
              <Tag icon={CalendarDays} title="Grant period">
                {dateRange}
              </Tag>
            )
          )}
          {awardedAmount && (
            <Tag icon={CircleDollarSign} title="Awarded amount">
              {awardedAmount}
            </Tag>
          )}
          {grant.primaryFosType && (
            <Tag icon={Microscope} title="Field of science">
              {grant.primaryFosType}
            </Tag>
          )}
          {grant.programOfficerName && (
            <Tag icon={Mail} title="Program officer">
              {grant.programOfficerEmail ? (
                <a href={`mailto:${grant.programOfficerEmail}`}>{grant.programOfficerName}</a>
              ) : (
                grant.programOfficerName
              )}
            </Tag>
          )}
        </ul>
      </div>
    </div>
  );
}
