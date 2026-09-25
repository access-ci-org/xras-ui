import { useAtomValue } from "jotai";
import { CalendarPlus, FileCheck, Pencil, Trash2, type LucideIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useRequest } from "./helpers/hooks";
import { routesAtom } from "../shared/routes";

type ButtonSpec = [string, string | ((e: React.MouseEvent) => void), LucideIcon?, "destructive"?];

export default function RequestActionButtons({
  requestId,
  grantNumber,
}: {
  requestId: number;
  grantNumber: string;
}) {
  const { request, toggleActionsModal, toggleDeleteModal } = useRequest(requestId, grantNumber);
  const routes = useAtomValue(routesAtom);
  if (!request) return null;

  const { actions, allowedActions } = request;
  const buttons: ButtonSpec[] = [];

  if (allowedActions) {
    if ("Extension" in allowedActions || "Renewal" in allowedActions)
      buttons.push([
        "Extend End Date",
        (e) => {
          e.preventDefault();
          toggleActionsModal();
        },
        CalendarPlus,
      ]);
    if ("Final Report" in allowedActions)
      buttons.push([
        "Submit Final Report",
        `${routes.request_action_path(requestId, "new")}?action_type=Final+Report`,
        FileCheck,
      ]);
  }

  const action = actions.find((action) => action.isRequest);
  if (action) {
    const ops = action.allowedOperations || [];
    if (ops.includes("Edit"))
      buttons.push(["Edit", routes.edit_request_path(request.requestId), Pencil]);
    if (ops.includes("Delete"))
      buttons.push([
        "Delete",
        (e) => {
          e.preventDefault();
          toggleDeleteModal(action.actionId);
        },
        Trash2,
        "destructive",
      ]);
  }

  return (
    <>
      {buttons.map(([label, url, Icon, variant]) => {
        const content = (
          <>
            {Icon && <Icon className="mr-1 size-4" />}
            {label}
          </>
        );
        const className = buttonVariants({ variant, className: "ml-2 whitespace-nowrap" });
        return typeof url === "function" ? (
          <button key={label} className={className} onClick={url}>
            {content}
          </button>
        ) : (
          <a key={label} className={className} href={url}>
            {content}
          </a>
        );
      })}
    </>
  );
}
