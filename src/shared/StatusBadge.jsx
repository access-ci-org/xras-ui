export default function StatusBadge({ status, title }) {
  const color =
    {
      Active: "primary",
      Approved: "primary",
      New: "secondary",
      Pending: "secondary",
      "Under Review": "secondary",
      "Returned for Corrections": "secondary"
    }[status] || "dark";
  return (
    <span className={`badge text-bg-${color} align-self-center`} title={title}>
      {status}
    </span>
  );
}
