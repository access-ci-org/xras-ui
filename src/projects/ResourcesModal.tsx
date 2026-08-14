import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
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
        <li
          key={res.resourceId}
          className="flex items-center justify-between border-b px-4 py-2 last:border-b-0"
        >
          {res.name}
          {/* Bootstrap's `.badge.rounded-pill`, whose metrics are all relative
              to the surrounding text. */}
          <span
            className={`rounded-full px-[0.65em] py-[0.35em] text-[0.75em] font-bold leading-none text-white ${
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
      <DialogContent className="max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Complete Your Exchange</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <p>
            Please review your exchange to make sure it includes all the resources you need. Once you
            submit it, you will not be able to request another exchange until this one has been
            processed by the resource providers.
          </p>
          {/* Bootstrap's `.list-group`: a bordered box whose items are divided
              by their own bottom borders. */}
          <ul className="mb-4 border">{changes}</ul>
          {questions.length ? (
            <>
              {/* The ACCESS theme's `h2`, which the shadow root cuts off. */}
              <h2 className="mb-4 mt-7 text-2xl font-bold leading-normal">Resource Questions</h2>
              <p>
                Some of the resources you selected have associated questions. Please answer the
                questions below.
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
        </DialogBody>
        <DialogFooter>
          <Button onClick={() => toggleResourcesModal()}>Continue Editing</Button>
          <Button
            variant="secondary"
            onClick={() => saveResources()}
            disabled={hasUnansweredQuestions}
          >
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
