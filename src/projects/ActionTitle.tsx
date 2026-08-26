import { useAtomValue } from "jotai";
import { Pencil, Trash2 } from "lucide-react";
import { formatDate } from "../shared/helpers/utils";
import { routesAtom } from "../shared/routes";
import InlineButton from "../shared/InlineButton";
import type { Action, Request } from "./types";

export default function ActionTitle({
  action,
  request,
  toggleDeleteModal,
}: {
  action: Action;
  request: Request;
  toggleDeleteModal: (actionId: number) => void;
}) {
  const routes = useAtomValue(routesAtom);
  const ops = action.allowedOperations || [];
  const isExchange = ["Exchange", "Transfer"].includes(action.type);
  const buttons = [];

  if (ops.includes("Edit") && !isExchange)
    buttons.push(
      <InlineButton
        key="edit"
        href={
          action.isRequest
            ? routes.edit_request_path(request.requestId)
            : routes.edit_request_action_path(request.requestId, action.actionId)
        }
        icon={Pencil}
        title="Edit action"
      />,
    );

  if (ops.includes("Delete") && !isExchange)
    buttons.push(
      <InlineButton
        key="delete"
        color="danger"
        icon={Trash2}
        onClick={() => toggleDeleteModal(action.actionId)}
        title="Delete action"
      />,
    );

  const actionName = `${action.type}: ${formatDate(action.date)}`;

  return (
    <>
      {action.detailAvailable && !isExchange ? (
        <a href={routes.request_action_path(request.requestId, action.actionId)}>{actionName}</a>
      ) : (
        actionName
      )}
      {buttons}
    </>
  );
}
