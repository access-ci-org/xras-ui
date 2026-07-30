import type { XrasUser } from "./types";

export default function UserName({ user }: { user: XrasUser }) {
  const name = `${user.lastName}, ${user.firstName}`;
  let title = name;
  const userInfo = [user.organization, user.email].filter((info) => info).join(", ");
  if (userInfo) title += `: ${userInfo}`;
  return <abbr title={title}>{name}</abbr>;
}
