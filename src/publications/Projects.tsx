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
      {!projectsSelected && (
        <Alert className="mt-0" color="danger">
          You must select at least one project
        </Alert>
      )}

      <div className="flex flex-col">
        {projects.map((p, idx) => (
          <div
            key={p.grant_number}
            className={cn(
              "cursor-pointer border border-b-0 px-4 py-2 last:border-b hover:bg-muted",
              p.selected && "bg-[#d1e7dd] text-[#0a3622] hover:bg-[#bcd0c7]",
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
