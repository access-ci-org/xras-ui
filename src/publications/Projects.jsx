import { useDispatch, useSelector } from "react-redux";
import { getProjects, toggleProject } from "./helpers/publicationEditSlice";

export default function Projects() {
  const dispatch = useDispatch();
  const projects = useSelector(getProjects);

  const projectClass = (project) => {
    return `list-group-item list-group-item-action clickable ${
      project.selected ? "list-group-item-success" : ""
    }`;
  };

  const projectsSelected = () => {
    return projects.filter((p) => p.selected).length > 0;
  };

  return (
    <div className={"row"}>
      <div className={"col"}>
        {projectsSelected() ? (
          ""
        ) : (
          <div className="alert alert-danger">
            You must select at least one project
          </div>
        )}

        <div className={"list-group"}>
          {projects.map((p, idx) => (
            <div
              key={`project_${p.grant_number}`}
              className={projectClass(p)}
              onClick={() => dispatch(toggleProject(idx))}
            >
              {p.grant_number}: {p.title}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
