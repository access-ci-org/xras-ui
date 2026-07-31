import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatBoolean, formatNumber } from "../shared/helpers/utils";
import ResourceQuestion from "./ResourceQuestion";
import { useProject, useRequest } from "./helpers/hooks";

export default function ResourcesModal({
  requestId,
  grantNumber,
}: {
  requestId: number;
  grantNumber: string;
}) {
  const { request, saveResources, toggleResourcesModal } = useRequest(requestId, grantNumber);
  const { project } = useProject(grantNumber || request?.grantNumber);

  if (!request || !project || request.error || project.error) return null;

  const questions: NonNullable<(typeof request.resources)[number]["questions"]> = [];
  const changes = request.resources
    .filter((res) => res.allocated != res.requested)
    .map((res) => {
      const transfer = res.requested - res.allocated;
      if (res.questions) questions.push(...res.questions);
      return (
        <li key={res.resourceId} className="mb-0 flex items-center justify-between border-b py-2">
          {res.name}
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium text-white ${
              transfer > 0 ? "bg-primary" : "bg-destructive"
            }`}
          >
            {res.isBoolean ? (
              formatBoolean(res.requested === 1)
            ) : (
              <>
                {transfer > 0 ? "+" : ""}
                {formatNumber(transfer, { decimalPlaces: res.decimalPlaces })} {res.unit}
              </>
            )}
          </span>
        </li>
      );
    });

  const hasUnansweredQuestions = questions.some(
    ({ attributes, values }) => values.length == 0 && attributes[0].required,
  );

  return (
    <Dialog open={request.showResourcesModal} onOpenChange={() => toggleResourcesModal()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Complete Your Exchange</DialogTitle>
        </DialogHeader>
        <p>
          Please review your exchange to make sure it includes all the resources you need. Once you
          submit it, you will not be able to request another exchange until this one has been processed
          by the resource providers.
        </p>
        <ul className="mb-3">{changes}</ul>
        {questions.length ? (
          <>
            <h2>Resource Questions</h2>
            <p>
              Some of the resources you selected have associated questions. Please answer the questions
              below.
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
        <DialogFooter>
          <Button onClick={() => toggleResourcesModal()}>Continue Editing</Button>
          <Button variant="outline" onClick={() => saveResources()} disabled={hasUnansweredQuestions}>
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
