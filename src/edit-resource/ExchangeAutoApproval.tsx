import { useAtomValue, useSetAtom } from "jotai";
import { cn } from "@/lib/utils";
import {
  ADMIN_ADDON,
  ADMIN_ADDON_INPUT,
  ADMIN_H2,
  ADMIN_HELP,
  ADMIN_INPUT,
  ADMIN_INPUT_PREPEND,
  ADMIN_LABEL,
  ADMIN_SPAN4,
} from "../shared/adminTheme";
import { resourceDetailsAtom, unitTypesOptionsAtom, updateResourceFieldAtom } from "./atoms";

export const ExchangeAutoApproval = () => {
  const resourceDetails = useAtomValue(resourceDetailsAtom);
  const unitTypesOptions = useAtomValue(unitTypesOptionsAtom);
  const updateResourceField = useSetAtom(updateResourceFieldAtom);

  if (!resourceDetails) return null;

  const unitTypeLabel = unitTypesOptions.find(
    (option) => option.value.toString() === resourceDetails.unit_type_id.toString(),
  )?.label;

  return (
    <div>
      <h2 className={ADMIN_H2}>Auto-approve Exchanges</h2>
      <small className={ADMIN_HELP}>
        If this value is set to any number greater than 0, then exchanges to your resource will be
          automatically approved if they meet the following criteria:
          <ul>
              <li>The project has already had an approved exchange to this resource in the past.</li>
              <li>The exchange amount (in units) is less than or equal to the amount in this field</li>
              <li>The exchange amount is positive (a transfer TO this resource)</li>
          </ul>
      </small>
      <label className={ADMIN_LABEL} htmlFor="auto-approve-exchange-limit">
        Auto-approve exchanges less than or equal to:
      </label>
      <div className={ADMIN_INPUT_PREPEND}>
        {unitTypeLabel && <span className={ADMIN_ADDON}>{unitTypeLabel}</span>}
        <input
          id="auto-approve-exchange-limit"
          type="number"
          className={cn(ADMIN_INPUT, ADMIN_SPAN4, unitTypeLabel && ADMIN_ADDON_INPUT)}
          value={resourceDetails.auto_approve_exchange_limit ?? ""}
          onChange={(e) =>
            updateResourceField({ field: "auto_approve_exchange_limit", value: e.target.value })
          }
        />
      </div>
    </div>
  );
};
