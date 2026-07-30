import { useAtomValue, useSetAtom } from "jotai";
import { cn } from "@/lib/utils";
import Alert from "../shared/Alert";
import { editProjectsAtom, toggleProjectSelectedAtom } from "./atoms";

export default function Projects() {
  const projects = useAtomValue(editProjectsAtom);
  const toggleProjectSelected = useSetAtom(toggleProjectSelectedAtom);

  const projectsSelected = projects.some((p) => p.selected);

  return (
    <div>
      {!projectsSelected && <Alert color="danger">You must select at least one project</Alert>}

      <div className="flex flex-col">
        {projects.map((p, idx) => (
          <div
            key={p.grant_number}
            className={cn(
              "cursor-pointer border border-b-0 p-3 last:border-b hover:bg-muted",
              p.selected && "bg-primary/10",
            )}
            onClick={() => toggleProjectSelected(idx)}
          >
            {p.grant_number}: {p.title}
          </div>
        ))}
      </div>
    </div>
  );
}
