import { useState } from "react";
import { Link } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import Publication from "./Publication";
import type { Project as ProjectType, Resource } from "./types";

const Project = ({ project }: { project: ProjectType }) => {
  const resources = project.resources;
  const [showAlert, setShowAlert] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [expandAbstract, setExpandAbstract] = useState(false);
  const canExpand = project.abstract.length >= 300;
  const abstractPreview = canExpand ? `${project.abstract.substring(0, 300)}...` : project.abstract;

  const formatNumber = (resource: Resource) => {
    let units = resource.units ? resource.units : resource.resourceUnits;
    const amount = resource.allocation ? resource.allocation : resource.amount;

    if (units == "[Yes = 1, No = 0]" || units == "Yes / No") {
      return amount == "1.0" ? "Yes" : "No";
    } else {
      let allocation = "0";
      if (amount && parseInt(amount)) {
        allocation = parseInt(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      }

      if (units == "ACCESS Credits") {
        units = (
          <span title="universal currency that can be exchanged for resource units">
            ACCESS Credits
          </span>
        );
      }

      if (units == "Dollars") {
        return `$${allocation}`;
      }

      return (
        <>
          {allocation}&nbsp;{units}
        </>
      );
    }
  };

  const copyRequestNumber = () => {
    const { origin, pathname } = window.location;
    const link = `${origin}${pathname}?_requestNumber=${project.requestNumber}`;
    navigator.clipboard.writeText(link);
    setTimeout(() => setShowAlert(false), 2000);
  };

  const requestNumber = () => {
    if (project.requestNumber && project.requestNumber != "") return `(${project.requestNumber})`;
    return "";
  };

  const requestNumberLink = () => {
    if (!requestNumber()) return <></>;

    return (
      <TooltipProvider>
        <Tooltip open={showAlert} onOpenChange={setShowAlert}>
          <TooltipTrigger asChild>
            <button onClick={copyRequestNumber} className="border-none bg-transparent text-white">
              <Link className="size-5" aria-label="Direct link to project" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">Link Copied!</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const formattedPIName = () => {
    const newName = project.pi.split(",");
    return `${newName[1]} ${newName[0]}`;
  };

  const coPIs = () => {
    if (!project.coPis || project.coPis.length <= 0) return "";

    return (
      <>
        <br />
        <small className="italic">
          CoPI(s): {project.coPis.map((pi) => `${pi.name} (${pi.organization})`).join(";")}
        </small>
      </>
    );
  };

  const projectDates = () => {
    if (!project.beginDate || !project.endDate) return "-";

    return (
      <>
        {project.beginDate} to {project.endDate}
      </>
    );
  };

  const requestTitle = () => {
    if (project.allocationType === "NAIRR Start-Up") {
      return (
        <span className="font-bold">
          {requestNumber()} Start-Up: {formattedPIName()}, <em>{project.piInstitution}</em>
        </span>
      );
    }
    return (
      <>
        <span className="font-bold">
          {requestNumber()} {project.requestTitle}
        </span>{" "}
        <br />
        <span className="italic">
          {project.pi} <small>({project.piInstitution})</small>
        </span>
        {coPIs()}
      </>
    );
  };

  const resourceList = (
    <table className="mb-0 mt-2 w-full border-collapse border">
      <thead>
        <tr className="border-b">
          <td className="p-2">
            <span>Resource</span>
          </td>
          <td className="p-2">
            <span>Allocation</span>
          </td>
        </tr>
      </thead>
      <tbody>
        {resources.map((r, i) => (
          <tr key={`resource_${project.requestId}_${i}`} className="border-b">
            <td className="p-2">{r.resourceName}</td>
            <td className="whitespace-nowrap p-2">{formatNumber(r)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const resourcesRow = (
    <>
      <div className="mt-2 border-b font-bold">Resources</div>
      <div>{resourceList}</div>
    </>
  );

  const publicationsModal = (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{project.requestTitle}</DialogTitle>
        </DialogHeader>
        <div>
          {project?.publications?.map((p, i) => (
            <div key={`publication_${i}`}>
              <Publication publication={{ ...p, projects: [] }} index={i} />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const projectContent = () => {
    if (project.allocationType === "NAIRR Start-Up") {
      return resourcesRow;
    }
    return (
      <>
        <div className="mt-2 border-b font-bold">Abstract</div>

        <div style={{ whiteSpace: "pre-wrap", display: "inline" }}>
          {expandAbstract ? project.abstract : abstractPreview}
        </div>
        {canExpand && (
          <button
            onClick={() => setExpandAbstract(!expandAbstract)}
            className="inline border-none bg-transparent font-bold"
          >
            {expandAbstract ? "Show Less" : "Read More"}
          </button>
        )}
        <div className="mt-2 flex flex-wrap gap-6">
          <div className="flex-1 lg:basis-1/2">
            <div className="border-b font-bold">Resources</div>
            <div>{resourceList}</div>
          </div>
          {project?.publications?.length > 0 && (
            <div className="flex-1 lg:basis-1/2">
              <div className="border-b font-bold">Publications</div>
              <div className="mt-2 pb-0" key={`publication_${project.projectId}_0`}>
                <Publication
                  publication={{ ...project.publications[0], projects: [] }}
                  index={0}
                  fontSize="16px"
                />
              </div>
              {project?.publications?.length > 1 && (
                <Button onClick={() => setShowModal(true)}>
                  View More ({project.publications.length})
                </Button>
              )}
              {publicationsModal}
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="mb-4 border">
      <div className="flex justify-between bg-primary p-3 text-white">
        <div>{requestTitle()}</div>
        <div>{requestNumberLink()}</div>
      </div>
      <div className="p-3">
        <div className="flex border-b font-bold">
          <div className="flex-1">Field of Science</div>
          <div className="flex-1" title='A specific level of allocation; also referred to as "Opportunity"'>
            Project Type
          </div>
          <div className="flex-1">Dates</div>
        </div>

        <div className="flex">
          <div className="flex-1">{project.fos}</div>
          <div className="flex-1">{project.allocationType}</div>
          <div className="flex-1">{projectDates()}</div>
        </div>

        {projectContent()}
      </div>
    </div>
  );
};

export default Project;
