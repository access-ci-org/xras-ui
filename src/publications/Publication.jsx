import PublicationCitation from "./PublicationCitation";
import { parseResourceName } from "../shared/helpers/utils";
import InlineButton from "../shared/InlineButton";
import style from "./Publication.module.css";

export default function Publication({ publication, onEdit }) {
  const { projects, publication_type: pubType, tags } = publication;
  const grant_numbers = projects.map((project) => project.grant_number);

  return (
    <div className="col-12 mb-2 border-bottom">
      <div className="card" style={{ border: "unset" }}>
        <div className="card-body pt-2">
          <div className={style.citation}>
            <PublicationCitation publication={publication} />
            {onEdit && publication.can_edit && (
              <InlineButton
                onClick={() => onEdit(publication.publication_id)}
                icon="pencil"
                title="Edit publication"
              />
            )}
          </div>
          <ul className={style.tags}>
            <li key="project-type">
              <i className="bi bi-file-earmark"></i>
              {pubType === "Other" ? "Publication" : pubType}
            </li>
            {grant_numbers.map((grant, index) => (
              <li key={`grant_${index}`} id={`project_${index}`}>
                <a
                  href={`https://allocations.access-ci.org/current-projects?_requestNumber=${grant}`}
                  id={`grant_link${index}`}
                  target="_blank"
                  rel="noreferrer"
                  title={`Supported by project ${grant}`}
                >
                  <i className="bi bi-link-45deg"></i>
                  {grant}
                </a>
              </li>
            ))}
            {tags.map((tag) => {
              const { full, short } = parseResourceName(tag);
              return (
                <li key={tag}>
                  <i className="bi bi-tag"></i>{" "}
                  {short ? <abbr title={full}>{short}</abbr> : full}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
