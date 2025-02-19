import { useRef, useState } from "react";
import { useSelector } from "react-redux";
import style from "./Project.module.scss";
import Accordion  from "react-bootstrap/Accordion";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from 'react-bootstrap/Tooltip';
import { selectIsSingleEntry } from "./helpers/browserSlice";

const Project = ({ project }) => {
  const resources = project.resources;
  const [showAlert, setShowAlert] = useState(false);
  const singleEntry = useSelector( selectIsSingleEntry );
  const defaultActiveKeys = singleEntry ? ['0','1'] : [];

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
    return <></>
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

  return (
    <div className="card mb-4">
      <div className="card-header bg-primary text-white">
          <div className="d-flex justify-content-between">
            <div>
              <span className="fw-bold">{requestNumber()} {project.requestTitle}</span> <br />
              <span className="fst-italic">{project.pi} <small> ({project.piInstitution}) </small></span>
              { coPIs() }
            </div>
            <div>
              { requestNumberLink() }
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

        <Accordion defaultActiveKey={defaultActiveKeys} activeKey={defaultActiveKeys} flush className="mt-3 mb-1" alwaysOpen>
          <Accordion.Item eventKey="0">
            <Accordion.Header>
                Resources
            </Accordion.Header>
            <Accordion.Body>
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
            </Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey="1">
            <Accordion.Header>
              Abstract
            </Accordion.Header>
            <Accordion.Body>
              <div style={{ whiteSpace: "pre-wrap", padding: "5px" }}>{ project.abstract }</div>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>

      </div>
    </div>
)
};

export default Project;
