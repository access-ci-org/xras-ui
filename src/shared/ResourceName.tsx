import { BookOpen } from "lucide-react";
import config from "./helpers/config";
import { icon, parseResourceName } from "./helpers/utils";
import InlineButton from "./InlineButton";
import type { Resource } from "./types";

export default function ResourceName({
  resource,
  userGuide = true,
}: {
  resource: Resource;
  userGuide?: boolean;
}) {
  const { full, short } = parseResourceName(resource.name);
  const displayName = short ? <abbr title={full}>{short}</abbr> : full;
  return (
    <>
      {icon(config.resourceTypeIcons[resource.icon])} {displayName}
      {!resource.isCredit && resource.userGuideUrl && userGuide ? (
        <InlineButton
          icon={BookOpen}
          href={resource.userGuideUrl}
          target="_blank"
          title={`${resource.name} User Guide`}
        />
      ) : null}
    </>
  );
}
