import { useProject } from "./helpers/hooks";
import config from "../shared/helpers/config";
import { icon, formatNumber, roles } from "../shared/helpers/utils";

import Grid from "../shared/Grid";

const columns = [
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
    format: (value) => {
      const names = value.slice(0, 3);
      if (value.length > 4)
        names[2] = `${formatNumber(value.length - 3)} others`;
      return names
        .map((name, i) => {
          const diff = names.length - i;
          return `${name}${
            diff > 2 ? "," : diff == 2 && names.length > 1 ? " and" : ""
          }`;
        })
        .join(" ");
    },
  },
];

const OverviewUsers = ({ requestId, grantNumber }) => {
  const { project } = useProject(grantNumber);
  if (!project) return;

  const rows = roles
    .map(({ role, name }) => {
      return {
        role: name,
        users: (project.users || [])
          .filter((user) => user.role === role)
          .map((user) => `${user.firstName} ${user.lastName}`),
      };
    })
    .filter((row) => row.users.length > 0);

  return rows.length ? <Grid rows={rows} columns={columns} /> : null;
};

export default OverviewUsers;
