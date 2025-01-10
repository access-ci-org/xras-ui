import config from "./helpers/config";
import { icon, parseResourceName } from "./helpers/utils";

import InlineButton from "./InlineButton";

export default function ResourceName({ resource, userGuide = true }) {
  const { full, short } = parseResourceName(resource.name);
  const displayName = short ? <abbr title={full}>{short}</abbr> : full;
  return (
    <>
      {icon(config.resourceTypeIcons[resource.icon])} {displayName}
      {!resource.isCredit && resource.userGuideUrl && userGuide ? (
        <InlineButton
          icon="book"
          href={resource.userGuideUrl}
          target="_blank"
          title={`${resource.name} User Guide`}
        />
      ) : null}
    </>
  );
}
