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
        If auto-approval is enabled, by setting this value to any number greater than 0, then any
        Exchange request for your resource, where the project has already had an approved exchange
        in the past, will be automatically approved if it is less than or equal to the resource
        limit specified.
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
