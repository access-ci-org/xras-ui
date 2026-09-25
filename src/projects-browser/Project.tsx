import { useState, type ReactNode } from "react";
import { Link } from "lucide-react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import Publication from "./Publication";
import type { Project as ProjectType, Resource } from "./types";

/*
 * Bootstrap's `.row` and `.col`, at the 1.25rem grid gutter this app's build
 * uses: half of it in each column's padding, cancelled again by the row's
 * negative margin, so the columns sit a full gutter apart but flush with the
 * edges of whatever contains the row.
 */
const ROW = "-mx-2.5 flex flex-wrap";
const COL = "shrink-0 grow basis-0 px-2.5";

const Project = ({ project }: { project: ProjectType }) => {
  const resources = project.resources;
  const [showAlert, setShowAlert] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [expandAbstract, setExpandAbstract] = useState(false);
  const canExpand = project.abstract.length >= 300;
  const abstractPreview = canExpand ? `${project.abstract.substring(0, 300)}...` : project.abstract;

  const formatNumber = (resource: Resource) => {
    let units: ReactNode = resource.units ? resource.units : resource.resourceUnits;
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
    void navigator.clipboard.writeText(link);
    /* The old `OverlayTrigger` opened on the click itself; the tooltip is
       controlled here, so the click has to open it as well as schedule the
       two seconds after which it closes again. */
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 2000);
  };

  const requestNumber = () => {
    if (project.requestNumber && project.requestNumber != "") return `(${project.requestNumber})`;
    return "";
  };

  const requestNumberLink = () => {
    if (!requestNumber()) return <></>;

    return (
      <Tooltip open={showAlert} onOpenChange={setShowAlert}>
        <TooltipTrigger asChild>
          {/* The old markup drew Bootstrap's `bi-link-45deg` at 24px in a
              button the UA padded; `p-1.5` stands in for that padding. */}
          <button
            onClick={copyRequestNumber}
            className="cursor-pointer border-none bg-transparent p-1.5 text-white"
          >
            <Link className="size-6" aria-label="Direct link to project" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="left">Link Copied!</TooltipContent>
      </Tooltip>
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

  /*
   * Bootstrap's `.table.table-striped.table-bordered`: 0.5rem cells with a 1px
   * border around each one, body rows aligned to the top of their cells, and
   * rgba(0, 0, 0, .05) behind the odd ones.
   */
  const resourceList = (
    <table className="mb-0 mt-2 w-full">
      <thead className="align-bottom">
        <tr>
          <td className="border p-2">
            <span>Resource</span>
          </td>
          <td className="border p-2">
            <span>Allocation</span>
          </td>
        </tr>
      </thead>
      <tbody className="align-top">
        {resources.map((r, i) => (
          <tr key={`resource_${project.requestId}_${i}`} className="odd:bg-black/5">
            <td className="border p-2">{r.resourceName}</td>
            <td className="whitespace-nowrap border p-2">{formatNumber(r)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const resourcesRow = (
    <>
      <div className={`${ROW} mt-2 font-bold`}>
        <div className="w-1/4 shrink-0 border-b px-2.5">Resources</div>
      </div>
      <div className={ROW}>
        <div className={COL}>{resourceList}</div>
      </div>
    </>
  );

  const publicationsModal = (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{project.requestTitle}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          {project?.publications?.map((p, i) => (
            <div key={`publication_${i}`}>
              <Publication publication={{ ...p, projects: [] }} index={i} />
            </div>
          ))}
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
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
        {/* The heading `span` was the `.col` itself here, so its `mb-1` counted
            — the other headings' spans sit inside a `.col` and are inline. */}
        <div className={`${ROW} mt-2 border-b font-bold`}>
          <span className={`${COL} mb-1`}>Abstract</span>
        </div>

        <div style={{ whiteSpace: "pre-wrap", display: "inline" }}>
          {expandAbstract ? project.abstract : abstractPreview}
        </div>
        {canExpand && (
          <button
            onClick={() => setExpandAbstract(!expandAbstract)}
            className="inline cursor-pointer border-none bg-transparent font-bold"
          >
            {expandAbstract ? "Show Less" : "Read More"}
          </button>
        )}
        {/* `.col-lg-6` twice: side by side once the viewport reaches the `lg`
            breakpoint, stacked below it. The left one carried `.flex-fill`, so
            it grows into the space the right one leaves when there are no
            publications. */}
        <div className={`${ROW} mt-2`}>
          <div className="w-full shrink-0 grow px-2.5 lg:w-1/2">
            <div className={`${ROW} border-b font-bold`}>
              <div className={COL}>
                <span className="font-bold">Resources</span>
              </div>
            </div>
            <div className={ROW}>
              <div className={COL}>{resourceList}</div>
            </div>
          </div>
          {project?.publications?.length > 0 && (
            <div className="w-full shrink-0 px-2.5 lg:w-1/2">
              <div className={`${ROW} border-b font-bold`}>
                <div className={COL}>
                  <span className="font-bold">Publications</span>
                </div>
              </div>
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
    /* `.mb-4` is 1.5rem in Bootstrap's spacing scale, not Tailwind's 1rem. */
    <Card className="mb-6">
      <CardHeader className="block bg-primary text-white">
        <div className="flex justify-between">
          <div>{requestTitle()}</div>
          <div>{requestNumberLink()}</div>
        </div>
      </CardHeader>
      <CardBody>
        <div className={`${ROW} border-b font-bold`}>
          <div className={COL}>
            <span>Field of Science</span>
          </div>
          <div className={COL}>
            <span title='A specific level of allocation; also referred to as "Opportunity"'>
              Project Type
            </span>
          </div>
          <div className={COL}>
            <span>Dates</span>
          </div>
        </div>

        <div className={ROW}>
          <div className={COL}>{project.fos}</div>
          <div className={COL}>{project.allocationType}</div>
          <div className={COL}>{projectDates()}</div>
        </div>

        {projectContent()}
      </CardBody>
    </Card>
  );
};

export default Project;
