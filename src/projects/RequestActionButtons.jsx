import { useRequest } from "./helpers/hooks";
import config from "../shared/helpers/config";

export default function RequestActionButtons({ requestId, grantNumber }) {
  const { request, toggleActionsModal, toggleDeleteModal } = useRequest(
    requestId,
    grantNumber
  );
  if (!request) return;

  const { actions, allowedActions } = request;
  const buttons = [];

  if (allowedActions) {
    if ("Extension" in allowedActions || "Renewal" in allowedActions)
      buttons.push([
        "Extend End Date",
        (e) => {
          e.preventDefault();
          toggleActionsModal();
        },
        "calendar-plus",
      ]);
    if ("Final Report" in allowedActions)
      buttons.push([
        "Submit Final Report",
        `${config.routes.request_action_path(
          requestId,
          "new"
        )}?action_type=Final+Report`,
        "file-earmark-check",
      ]);
  }

  const action = actions.find((action) => action.isRequest);
  if (action) {
    const ops = action.allowedOperations || [];
    if (ops.includes("Edit"))
      buttons.push([
        "Edit",
        config.routes.edit_request_path(request.requestId),
        "pencil",
      ]);
    if (ops.includes("Delete"))
      buttons.push([
        "Delete",
        (e) => {
          e.preventDefault();
          toggleDeleteModal(action.actionId);
        },
        "trash",
        "danger",
      ]);
  }

  return buttons.map(([label, url, icon, color]) => {
    const content = (
      <>
        {" "}
        {icon && <i className={`bi bi-${icon} me-1`} />}
        {label}
      </>
    );
    return typeof url === "function" ? (
      <button
        key={label}
        className={`btn btn-${color || "primary"} ms-2 text-nowrap`}
        onClick={url}
      >
        {content}
      </button>
    ) : (
      <a
        key={label}
        className={`btn btn-${color || "primary"} ms-2 text-nowrap`}
        href={url}
      >
        {content}
      </a>
    );
  });
}
