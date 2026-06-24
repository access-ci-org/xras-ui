import { useAtomValue } from "jotai";
import Project from "./Project";
import { projectsAtom } from "./atoms";

const ProjectList = () => {
  const projects = useAtomValue(projectsAtom);
  if (projects.length == 0) return <div>No Projects Found</div>;
  return (
    <div>
      {projects.map((p, i) => (
        <Project key={`project_${i}`} project={p} />
      ))}
    </div>
  );
};

export default ProjectList;
