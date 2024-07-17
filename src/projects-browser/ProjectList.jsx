import { useSelector } from "react-redux";
import Project from "./Project";
import { selectProjects } from "./helpers/browserSlice";

const ProjectList = () => {
  const projects = useSelector(selectProjects);
  if(projects.length == 0) return <div>No Projects Found</div>
  return (
    <div>
      {projects.map((p, i) => (
        <Project key={`project_${i}`} project={p} />
      ))}
    </div>
  );
};

export default ProjectList;
