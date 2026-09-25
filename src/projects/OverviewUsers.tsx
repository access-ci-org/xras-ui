import Grid, { type GridColumn } from "../shared/Grid";
import config from "../shared/helpers/config";
import { formatNumber, icon, roles } from "../shared/helpers/utils";
import { useProject } from "./helpers/hooks";

const columns: GridColumn[] = [
  {
    key: "role",
    name: "Role",
    format: (value) => (
      <>
        {icon(config.roleIcons[value])} {value}
      </>
    ),
  },
  {
    key: "users",
    name: "Users",
    format: (value: string[]) => {
      const names = value.slice(0, 3);
      if (value.length > 4) names[2] = `${formatNumber(value.length - 3)} others`;
      return names
        .map((name, i) => {
          const diff = names.length - i;
          return `${name}${diff > 2 ? "," : diff == 2 && names.length > 1 ? " and" : ""}`;
        })
        .join(" ");
    },
  },
];

export default function OverviewUsers({ grantNumber }: { grantNumber: string }) {
  const { project } = useProject(grantNumber);
  if (!project) return null;

  const rows = roles
    .map(({ role, name }) => ({
      role: name,
      users: (project.users || [])
        .filter((user) => user.role === role)
        .map((user) => `${user.firstName} ${user.lastName}`),
    }))
    .filter((row) => row.users.length > 0);

  return rows.length ? <Grid rows={rows} columns={columns} /> : null;
}
