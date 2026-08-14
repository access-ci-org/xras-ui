import { useMemo } from "react";
import { Provider, createStore } from "jotai";
import { Boxes, Cpu, UserPlus } from "lucide-react";
import Alert from "../shared/Alert";
import LoadingSpinner from "../shared/LoadingSpinner";
import config from "../shared/helpers/config";
import Project from "./Project";
import { useProjectsList } from "./helpers/hooks";

function ProjectsInner({ username, openFirst = 1 }: { username: string; openFirst?: number }) {
  const { error, loading, projects } = useProjectsList(username);

  if (loading) return <LoadingSpinner />;
  if (error)
    return (
      <Alert color="danger">
        {error}{" "}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.location.reload();
          }}
        >
          Reload the page
        </a>{" "}
        to try again.
      </Alert>
    );

  if (!projects.length)
    return (
      <div className="border border-muted bg-muted/50 pb-12 pt-12">
        <p className="mb-6 text-center text-3xl">You don&apos;t have any projects yet.</p>
        <div className="flex justify-center gap-2">
          <a className="w-1/4 bg-primary p-3 text-center text-primary-foreground" href={config.routes.project_types_path()}>
            <Boxes className="mx-auto mb-1 size-9" /> Learn about Project Types
          </a>
          <a
            className="w-1/4 bg-muted-foreground p-3 text-center text-white"
            href={config.routes.get_your_first_project_path()}
          >
            <Cpu className="mx-auto mb-1 size-9" /> Learn How to Get Your{" "}
            <br className="hidden xl:inline" /> First Project
          </a>
          <a className="w-1/4 bg-primary p-3 text-center text-primary-foreground" href={config.routes.how_to_path()}>
            <UserPlus className="mx-auto mb-1 size-9" /> Learn How to Join an Existing Project
          </a>
        </div>
      </div>
    );

  const expandedGrantNumber = new URLSearchParams(window.location.hash.slice(1)).get("grantNumber");
  return (
    <>
      {projects.map((project, i) => (
        <Project
          open={expandedGrantNumber ? expandedGrantNumber == project.grantNumber : i < openFirst}
          key={project.grantNumber}
          {...project}
        />
      ))}
    </>
  );
}

export default function Projects({ username, openFirst = 1 }: { username: string; openFirst?: number }) {
  const store = useMemo(() => createStore(), []);

  return (
    <Provider store={store}>
      <ProjectsInner username={username} openFirst={openFirst} />
    </Provider>
  );
}
