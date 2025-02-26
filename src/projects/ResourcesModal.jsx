import { useProject, useRequest } from "./helpers/hooks";
import { formatBoolean, formatNumber } from "../shared/helpers/utils";

import Modal from "react-bootstrap/Modal";
import ResourceQuestion from "./ResourceQuestion";

export default function ResourcesModal({ requestId, grantNumber }) {
  const { request, saveResources, toggleResourcesModal } = useRequest(
    requestId,
    grantNumber
  );
  const { project } = useProject(grantNumber || request.grantNumber);

  if (!request || !project || request.error || project.error) return;

  const questions = [];
  const changes = request.resources
    .filter((res) => res.allocated != res.requested)
    .map((res) => {
      const transfer = res.requested - res.allocated;
      if (res.questions) questions.push(...res.questions);
      return (
        <li
          key={res.resourceId}
          className="list-group-item d-flex justify-content-between align-items-center mb-0"
        >
          {res.name}
          <span
            className={`badge bg-${
              transfer > 0 ? "primary" : "danger"
            } rounded-pill`}
          >
            {res.isBoolean ? (
              formatBoolean(res.requested)
            ) : (
              <>
                {transfer > 0 ? "+" : ""}
                {formatNumber(transfer, res)} {res.unit}
              </>
            )}
          </span>
        </li>
      );
    });

  const hasUnansweredQuestions = questions.some(
    ({ attributes, values }) => values.length == 0 && attributes[0].required
  );

  return (
    <Modal
      size="lg"
      show={request.showResourcesModal}
      onHide={toggleResourcesModal}
      scrollable={true}
    >
      <Modal.Header closeButton>
        <Modal.Title>Complete Your Exchange</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          Please review your exchange to make sure it includes all the resources
          you need. Once you submit it, you will not be able to request another
          exchange until this one has been processed by the resource providers.
        </p>
        <ul className="list-group mb-3">{changes}</ul>
        {questions.length ? (
          <>
            <h2>Resource Questions</h2>
            <p>
              Some of the resources you selected have associated questions.
              Please answer the questions below.
            </p>
            {questions.map((question) => (
              <ResourceQuestion
                key={question.attributeSetId}
                question={question}
                requestId={requestId}
                grantNumber={grantNumber}
              />
            ))}
          </>
        ) : null}
      </Modal.Body>
      <Modal.Footer>
        <div className="d-flex">
          <button
            type="button"
            className="btn btn-primary me-2"
            onClick={toggleResourcesModal}
          >
            Continue Editing
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={saveResources}
            disabled={hasUnansweredQuestions}
          >
            Submit
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
