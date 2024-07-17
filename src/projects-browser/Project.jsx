import style from "./Project.module.scss";
import Accordion  from "react-bootstrap/Accordion";

const Project = ({ project }) => {
  const resources = project.resources;

  const formatNumber = (resource) => {
    let units = resource.units ? resource.units : resource.resourceUnits;
    const amount = resource.allocation ? resource.allocation : resource.amount;

    if(units == "[Yes = 1, No = 0]"){
      return resource.allocation == "1.0" ? "Yes" : "No"
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

  const requestNumber = () => {
    if(project.requestNumber && project.requestNumber != '') return `(${project.requestNumber})`
    return '';
  }

  return (
    <div className="card mb-4">
      <div className="card-header bg-primary text-white">
          <span className="fw-bold">{requestNumber()} {project.requestTitle}</span> <br />
          <span className="fst-italic">{project.pi} <small> ({project.piInstitution}) </small></span>
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
            {project.beginDate} to {project.endDate}
          </div>
        </div>

        <Accordion flush className="mt-3 mb-1">
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
              <div className={style.abstract}>{ project.abstract }</div>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>

      </div>
    </div>
)
};

export default Project;
