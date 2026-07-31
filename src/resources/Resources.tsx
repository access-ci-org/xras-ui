import { useState, useMemo, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { updateBackend } from "./helpers/actions";
import { sortResources, startScrolling, stopScrolling } from "./helpers/utils";
import ImportResourceModal from "./ImportResourceModal";
import type { ResourceListItem } from "./types";

const ACTIVE_TAB = "Active";
const INACTIVE_TAB = "Inactive";

export default function Resources({
  availableResources,
  unavailableResources = [],
  canAdd = false,
  relativeUrlRoot,
}: {
  availableResources: ResourceListItem[];
  unavailableResources?: ResourceListItem[];
  canAdd?: boolean;
  relativeUrlRoot: string;
}) {
  const sortedAvailableResources = useMemo(
    () => sortResources(availableResources),
    [availableResources],
  );
  const sortedUnavailableResources = useMemo(
    () => sortResources(unavailableResources),
    [unavailableResources],
  );
  const [resources, setResources] = useState(sortedAvailableResources);
  const [showImportModal, setShowImportModal] = useState(false);

  const draggedIndexRef = useRef<number | null>(null);
  const scrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [activeTab, setActiveTab] = useState(ACTIVE_TAB);

  const handleTabClick = (tabName: string) => {
    setActiveTab(tabName);
    if (tabName === ACTIVE_TAB) {
      setResources(sortedAvailableResources);
    } else {
      setResources(sortedUnavailableResources);
    }
  };

  const handleTabChange = (tabName: string, e: React.MouseEvent) => {
    e.preventDefault();
    handleTabClick(tabName);
  };

  useEffect(() => {
    setResources(sortedAvailableResources);
  }, [sortedAvailableResources]);

  const handleDragStart = (_e: React.DragEvent, index: number) => {
    draggedIndexRef.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndexRef.current === null || draggedIndexRef.current === index) return;

    const newResources = [...resources];
    const draggedItem = newResources[draggedIndexRef.current];
    newResources.splice(draggedIndexRef.current, 1);
    newResources.splice(index, 0, draggedItem);

    draggedIndexRef.current = index;
    setResources(newResources);

    // Scroll logic to start scroll scroll when dragging items
    const { clientY } = e;
    const scrollThreshold = 130;

    if (clientY < scrollThreshold) {
      startScrolling(-1, scrollIntervalRef);
    } else if (window.innerHeight - clientY < scrollThreshold) {
      startScrolling(1, scrollIntervalRef);
    } else {
      stopScrolling(scrollIntervalRef);
    }
  };

  const handleDrop = () => {
    draggedIndexRef.current = null;
    stopScrolling(scrollIntervalRef);
    updateBackend(relativeUrlRoot, resources);
  };

  useEffect(() => {
    return () => stopScrolling(scrollIntervalRef);
  }, []);

  return (
    <>
      <div className="mx-auto">
        {canAdd && (
          <Button className="float-right" onClick={() => setShowImportModal(true)}>
            Add a Resource from CIDeR
          </Button>
        )}
        <h2>Select a resource from the list to modify</h2>
        <p className="mb-4 italic text-muted-foreground">Drag items to reorder the list.</p>

        <div className="mx-auto w-full max-w-md p-4">
          <div className="flex border-b">
            {[ACTIVE_TAB, INACTIVE_TAB].map((tabName) => (
              <button
                key={tabName}
                type="button"
                className={cn(
                  "-mb-px border border-b-0 px-4 py-2",
                  activeTab === tabName
                    ? "border-border bg-background font-bold"
                    : "border-transparent text-muted-foreground",
                )}
                onClick={(e) => handleTabChange(tabName, e)}
              >
                {tabName}
              </button>
            ))}
          </div>

          <div className="list-none p-0">
            <div className="mb-2 flex justify-between rounded bg-muted p-2 font-bold">
              <span>Resource Name</span>
              <span>Repository Key</span>
            </div>
            {resources.map((resource, index) => (
              <div
                key={resource.resource_id}
                className="mb-1 flex cursor-move items-center justify-between rounded bg-muted/50 p-2 transition-colors last:mb-0 hover:bg-muted"
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={handleDrop}
              >
                <span
                  className="mr-4 inline-block h-4 w-[15px] shrink-0 bg-[linear-gradient(to_bottom,#999_20%,transparent_20%,transparent_40%,#999_40%,#999_60%,transparent_60%,transparent_80%,#999_80%)]"
                  aria-hidden
                />
                <span className="grow-[2]">
                  <a
                    href={`${relativeUrlRoot}/resources/${resource.resource_id}`}
                    className="text-[#0066cc] hover:underline"
                  >
                    {resource.display_resource_name}
                  </a>
                </span>
                <span className="grow text-right text-muted-foreground">
                  {resource.resource_repository_key || "N/A"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {showImportModal && <ImportResourceModal onClose={() => setShowImportModal(false)} />}
    </>
  );
}
