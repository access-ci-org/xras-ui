import { useState, useEffect } from "react";
import { useProjectsList } from "./helpers/hooks";
import config from "./helpers/config";

import Alert from "../shared/Alert";
import Project from "./Project";
import LoadingSpinner from "../shared/LoadingSpinner";

export default function Projects({ username, openFirst = 1 }) {
  const { error, loading, projects } = useProjectsList(username);
  const [expandedGrantNumber, setExpandedGrantNumber] = useState(null);
  const getGrantNumberFromHash = () => {
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    return params.get("grantNumber");
  };
  
  useEffect(() => {
    if (!loading && projects.length > 0) {
      const grantNumberFromHash = getGrantNumberFromHash();
      
      if (grantNumberFromHash) {
        setExpandedGrantNumber(grantNumberFromHash);
      }
    }
  }, [loading, projects]);
  
  useEffect(() => {
    const handleHashChange = () => {
      const grantNumberFromHash = getGrantNumberFromHash();
      setExpandedGrantNumber(grantNumberFromHash);
    };
    
    window.addEventListener("hashchange", handleHashChange);
    
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);
  
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
      <div className="pt-5 pb-5 text-bg-light border border-light-subtle">
        <p className="fs-2 text-center mb-4">
          You don&apos;t have any projects yet.
        </p>
        <div className="d-flex gap-2 justify-content-center">
          <a
            className="btn btn-primary w-25"
            href={config.routes.project_types_path()}
          >
            <i className="bi bi-boxes fs-1 d-block" /> Learn about Project Types
          </a>
          <a
            className="btn btn-secondary w-25"
            href={config.routes.get_your_first_project_path()}
          >
            <i className="bi bi-cpu fs-1 d-block" /> Learn How to Get Your{" "}
            <br className="d-none d-xxl-inline" /> First Project
          </a>
          <a
            className="btn btn-primary w-25"
            href={config.routes.how_to_path()}
          >
            <i className="bi bi-person-plus fs-1 d-block" /> Learn How to Join
            an Existing Project
          </a>
        </div>
      </div>
    );

  return (
    <div>
      {projects.map((project, i) => (
        <Project
          key={project.grantNumber}
          open={
            expandedGrantNumber === project.grantNumber ||
            (!expandedGrantNumber && i < openFirst)
          }
          onExpand={(grantNumber) => setExpandedGrantNumber(grantNumber)}
          {...project}
        />
      ))}
    </div>
  );
}