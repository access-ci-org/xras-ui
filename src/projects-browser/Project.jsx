import { useRef, useState } from "react";
import { useSelector } from "react-redux";
import style from "./Project.module.scss";
import Accordion  from "react-bootstrap/Accordion";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from 'react-bootstrap/Tooltip';
import { selectIsSingleEntry } from "./helpers/browserSlice";
import Publication from "./Publication.jsx";
import Modal from "react-bootstrap/Modal";

const Project = ({ project }) => {
  const resources = project.resources;
  const [showAlert, setShowAlert] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [expandAbstract, setExpandAbstract] = useState(false);
  const singleEntry = useSelector( selectIsSingleEntry );
  const canExpand = project.abstract.length >= 300;
  const abstractPreview = canExpand ? `${project.abstract.substring(0, 300)}...` : project.abstract ;

  const formatNumber = (resource) => {
    let units = resource.units ? resource.units : resource.resourceUnits;
    const amount = resource.allocation ? resource.allocation : resource.amount;

    if(units == "[Yes = 1, No = 0]" || units == "Yes / No"){
      return amount == "1.0" ? "Yes" : "No"
    } else {
      let allocation = "0";
      if(parseInt(amount)){
        allocation = parseInt(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      }

      if(units == "ACCESS Credits"){
        units = (<span className="tooltip-underline" title="universal currency that can be exchanged for resource units">ACCESS Credits</span>)
      }

      if(units == "Dollars"){
        return `$${allocation}`;
      }

      return (
        <>
          {allocation}&nbsp;{units}
        </>
      )
    }
  }

  const copyRequestNumber = () => {
    const { origin, pathname } = window.location;
    const link = `${origin}${pathname}?_requestNumber=${project.requestNumber}`;
    navigator.clipboard.writeText(link);
    setTimeout(() => setShowAlert(false), 2000);
  }

  const requestNumber = () => {
    if(project.requestNumber && project.requestNumber != '') return `(${project.requestNumber})`
    return "";
  }

  const renderTooltip = (
    <Tooltip id="link-tooltip">
      Link Copied!
    </Tooltip>
  )

  const requestNumberLink = () => {
    if(requestNumber()){
      const btnStyle = {
        background: "none",
        border: "none",
        color: "#fff",
        fontSize: "24px",
      };

      return (
        <OverlayTrigger
          placement="left"
          trigger="click"
          defaultShow={showAlert}
          show={showAlert}
          onToggle={() => setShowAlert(!showAlert)}
          overlay={renderTooltip}
        >
          <button
            onClick={copyRequestNumber}
            style={btnStyle}
          >
              <i className="bi bi-link-45deg"><div className="d-none">Direct link to project</div></i>
          </button>
        </OverlayTrigger>

      )
    }

    return <></>
  }

  const formattedPIName = () =>  {
      const newName = project.pi.split(",");
      return `${newName[1]} ${newName[0]}`
  }

  const coPIs = () =>  {
    if(!project.coPis || project.coPis.length <= 0) return "";

    return (
      <>
        <br />
        <small className="fst-italic">
          CoPI(s): { project.coPis.map((pi) => `${pi.name} (${pi.organization})`).join(';') }
        </small>
      </>
    );

  }

  const projectDates = () => {
    if(!project.beginDate || !project.endDate) return "-";

    return <>{project.beginDate} to {project.endDate}</>
  }

  const requestTitle = () => {
    if (project.allocationType === "NAIRR Start-Up") {
      return (
          <span className="fw-bold">{requestNumber()} Start-Up: {formattedPIName()}, <em> {project.piInstitution} </em> </span>
      )
    }
    return (
        <>
          <span className="fw-bold">{requestNumber()} {project.requestTitle}</span> <br />
          <span className="fst-italic">{project.pi} <small> ({project.piInstitution}) </small></span>
          { coPIs() }
        </>
    )
  }

  const resourceList = (
    <table className="table table-striped table-bordered mt-2 mb-0">
      <thead>
        <tr>
          <td><span className="m-0 p-0">Resource</span></td>
          <td><span className="m-0 p-0 d-inline">Allocation</span></td>
        </tr>
      </thead>
      <tbody>
        {resources.map((r,i) =>
          <tr key={`resource_${project.requestId}_${i}`}>
            <td>{r.resourceName}</td>
            <td style={{ whiteSpace: 'nowrap' }}>{formatNumber(r)}</td>
          </tr>
        )}
      </tbody>
    </table>
  )

  const resourcesRow = (
    <>
      <div className="row mt-2 fw-bold">
        <div className="col-3 border-bottom">
          Resources
        </div>
      </div>
      <div className="row">
        <div className="col">
          { resourceList }
        </div>
      </div>
    </>
  )

  const publicationsModal = (
      <Modal show={showModal} onHide={()=>setShowModal(false)} id={`publicationsModal_${project.projectId}`}>
        <Modal.Header closeButton>
            <Modal.Title>{project.requestTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {project?.publications?.map((p, i) => (
              <div key={`publication_${i}`}>
                  <Publication publication={{ ...p, projects: [] }} index={i} />
              </div>
          ))}
        </Modal.Body>
        <Modal.Footer>
            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal" onClick={()=>setShowModal(false)}>Close</button>
        </Modal.Footer>
      </Modal>
  );

  const projectContent = () => {
    if (project.allocationType === "NAIRR Start-Up"){
        return resourcesRow;
    }
    return (
      <>
        <div className="row fw-bold mt-2 border-bottom">
            <span className="col mb-1 pb-0">Abstract</span>
        </div>

        <div style={{ whiteSpace: "pre-wrap", display: "inline"}}>
            {expandAbstract ? project.abstract : abstractPreview }
        </div>
        {canExpand &&
            <button
                onClick={() => setExpandAbstract(!expandAbstract)}
                style={{ display: "inline", border: "none", background: "none", cursor: "pointer", fontWeight: "bold" }}>
                {expandAbstract ? 'Show Less' : 'Read More'}
            </button>}
        <div className="row mt-2">
          <div className="col-lg-6 left-panel flex-fill">
            <div className="row fw-bold border-bottom">
              <div className="col">
                <span className="mb-1 pb-0 fw-bold">Resources</span>
              </div>
            </div>
            <div className="row">
              <div className="col">
                {resourceList}
              </div>
            </div>
          </div>
          {project?.publications?.length > 0 &&
          <div className="col-lg-6 right-panel">
              <div className="row fw-bold border-bottom">
                  <div className="col">
                      <span className="mb-1 pb-0 fw-bold">Publications</span>
                  </div>
              </div>
            <div className="mt-2 pb-0" key={`publication_${project.projectId}_${0}`}>
              <Publication
                  publication={{...project.publications[0], projects: []}}
                  index={0}
                  fontSize="16px"
              />
            </div>
            {project?.publications?.length > 1 && (
              <button className="btn btn-primary" onClick={()=>setShowModal(true)}>
                  View More ({project.publications.length})
              </button>
            )}
            {publicationsModal}
          </div>
          }
        </div>
      </>
    )
  }

  return (
      <div className="card mb-4">
        <div className="card-header bg-primary text-white">
            <div className="d-flex justify-content-between">
                <div>
                    {requestTitle()}
                </div>
                <div>
                    {requestNumberLink()}
                </div>
            </div>
        </div>
        <div className="card-body">
          <div className="row fw-bold border-bottom">
            <div className="col">
              <span className="mb-1 pb-0">Field of Science</span>
            </div>
            <div className="col">
              <span className="mb-1 pb-0 tooltip-underline" title='A specific level of allocation; also referred to as "Opportunity"'>Project Type</span>
            </div>
            <div className="col">
              <span className="mb-1 pb-0">Dates</span>
            </div>
          </div>

          <div className="row">
            <div className="col">
              {project.fos}
            </div>
            <div className="col">
              {project.allocationType}
            </div>
            <div className="col">
              { projectDates() }
            </div>
          </div>

          { projectContent() }

        </div>
      </div>
  )
};

export default Project;
