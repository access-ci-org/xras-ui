export default function StatusBadge({ status, title }) {
  const displayStatus = status === "Hold" || status === "Hold Off" ? "Submitted" : status;
  const color =
    {
      Active: "primary",
      Approved: "primary",
      New: "secondary",
      Pending: "secondary",
      "Under Review": "secondary",
      "Returned for Corrections": "secondary"
    }[displayStatus] || "dark";
  return (
    <span className={`badge text-bg-${color} align-self-center`} title={title}>
      {displayStatus}
    </span>
  );
}
