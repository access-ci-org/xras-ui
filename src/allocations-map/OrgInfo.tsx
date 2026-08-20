import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { formatNumber } from "./utils";
import type { OrganizationType } from "./config";
import type { ActiveOrg, CreditType } from "./types";

const borderColors: Record<OrganizationType, string> = {
  user: "border-b-[#f07537]",
  rp: "border-b-primary",
};

function formatOrgs(
  orgs: [string, number][],
  orgType: OrganizationType,
  label: string,
  viewingType: OrganizationType,
) {
  orgs.sort((a, b) => b[1] - a[1]);
  const displayNames = orgs.slice(0, 3).map((org) => org[0]);
  if (orgs.length > 3) displayNames[2] = `${orgs.length - 2} other ${label}s`;
  const bold = orgType === viewingType;

  return displayNames.reduce<ReactNode[]>(
    (acc, name, i, names) => [
      ...acc,
      <span
        className={cn("border-b-[3px]", borderColors[orgType], bold && "font-semibold")}
        key={name}
      >
        {name}
      </span>,
      ["", " and ", ", "][names.length - i - 1],
    ],
    [],
  );
}

export default function OrgInfo({
  activeOrg,
  creditType,
  organizationMap,
  organizationType,
}: {
  activeOrg: ActiveOrg | null;
  creditType: CreditType;
  organizationMap: Record<string, string> | null;
  organizationType: OrganizationType;
}) {
  if (!activeOrg || !organizationMap) return null;
  const props = activeOrg.properties;
  const credits = Number(props[`${organizationType}Credits`]);
  const oppOrganizationType = organizationType === "rp" ? "user" : "rp";
  const creditsMap = JSON.parse(props[`${organizationType}CreditsMap`]) as Record<string, number>;
  const orgs: Record<OrganizationType, [string, number][]> = {
    user: [],
    rp: [],
  };

  orgs[organizationType].push([props.name, credits]);
  Object.keys(creditsMap).forEach((orgId) =>
    orgs[oppOrganizationType].push([organizationMap[orgId], creditsMap[orgId]]),
  );

  return (
    /* The same panel the legend uses, so it doesn't take the pointer events
       the map needs to keep tracking which organization is under it. */
    <div className="pointer-events-none absolute bottom-[25px] left-[25px] bg-white/50 p-2.5">
      {/* The 24rem is the paragraph's, so the panel is that wide plus padding. */}
      <p className="m-0 w-96 text-base leading-normal">
        Researchers at {formatOrgs(orgs.user, "user", "research institution", organizationType)}{" "}
        {creditType === "allocated" ? "were " : ""}
        {creditType}{" "}
        <span className="font-semibold">{formatNumber(credits)} ACCESS Credits</span>
        {creditType !== "allocated" ? (
          <>
            {" "}
            {creditType === "exchanged" ? "for" : "on"} resources at{" "}
            {formatOrgs(orgs.rp, "rp", "resource provider", organizationType)}
          </>
        ) : (
          ""
        )}
        .
      </p>
    </div>
  );
}
