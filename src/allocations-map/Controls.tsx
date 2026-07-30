import RadioGroup from "./RadioGroup";
import type { CreditType } from "./types";
import type { OrganizationType } from "./config";

export default function Controls({
  creditType,
  organizationType,
  setCreditType,
  setOrganizationType,
}: {
  creditType: CreditType;
  organizationType: OrganizationType;
  setCreditType: (value: CreditType) => void;
  setOrganizationType: (value: OrganizationType) => void;
}) {
  return (
    <div className="absolute left-[25px] top-[25px] bg-white/50 p-2.5">
      <h2>ACCESS Allocations</h2>
      <RadioGroup
        choices={[
          ["allocated", "Allocations"],
          ["exchanged", "Exchanges"],
          ["used", "Usage"],
        ]}
        label="Credit Type"
        value={creditType}
        setValue={(value) => setCreditType(value as CreditType)}
      />
      <RadioGroup
        choices={[
          ["user", "By Research Institution"],
          ["rp", "By Resource Provider"],
        ]}
        disabledValues={creditType === "allocated" ? ["rp"] : []}
        label="Organization Type"
        value={organizationType}
        setValue={(value) => setOrganizationType(value as OrganizationType)}
      />
    </div>
  );
}
