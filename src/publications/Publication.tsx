import { useSetAtom } from "jotai";
import { cn } from "@/lib/utils";
import { parseResourceName } from "../shared/helpers/utils";
import InlineButton from "../shared/InlineButton";
import PublicationCitation from "./PublicationCitation";
import { editPublicationAtom } from "./atoms";
import type { PublicationSummary } from "./types";

export default function Publication({
  allowEdit = true,
  last = false,
  publication,
}: {
  allowEdit?: boolean;
  last?: boolean;
  publication: PublicationSummary;
}) {
  const editPublication = useSetAtom(editPublicationAtom);
  const { projects, publication_type: pubType, resources = [] } = publication;
  const grantNumbers = projects.map((project) => project.grant_number);

  return (
    <div className={cn("mb-2 pb-2", !last && "border-b")}>
      <div className="border-none py-2">
        <div className="ml-[50px] indent-[-50px] text-lg leading-8">
          <PublicationCitation publication={publication} />
          {allowEdit && publication.can_edit && (
            <InlineButton
              onClick={() => editPublication(publication.publication_id)}
              icon="pencil"
              title="Edit publication"
            />
          )}
        </div>
        <ul className="m-0 list-none py-0 pl-[50px] pt-2.5">
          <li className="mr-4 inline-block text-base">
            <i className="bi bi-file-earmark mr-1" />
            {pubType === "Other" ? "Publication" : pubType}
          </li>
          {grantNumbers.map((grant, index) => (
            <li key={index} className="mr-4 inline-block text-base">
              <a
                href={`https://allocations.access-ci.org/current-projects?_requestNumber=${grant}`}
                target="_blank"
                rel="noreferrer"
                title={`Supported by project ${grant}`}
              >
                <i className="bi bi-link-45deg mr-1" />
                {grant}
              </a>
            </li>
          ))}
          {resources.map((resource) => {
            const { full, short } = parseResourceName(resource);
            return (
              <li key={resource} className="mr-4 inline-block text-base">
                <i className="bi bi-server mr-1" />
                {short ? <abbr title={full}>{short}</abbr> : full}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
