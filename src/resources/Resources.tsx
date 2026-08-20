import { useState, useMemo, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ADMIN_BODY, ADMIN_BTN_PRIMARY, ADMIN_H2 } from "../shared/adminTheme";
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
    if (draggedIndexRef.current === null || draggedIndexRef.current === index)
      return;

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
      <div className={cn("mx-auto", ADMIN_BODY)}>
        {canAdd && (
          <button
            type="button"
            className={cn("float-right block", ADMIN_BTN_PRIMARY)}
            onClick={() => setShowImportModal(true)}
          >
            Add a Resource from CIDeR
          </button>
        )}
        <h2 className={ADMIN_H2}>Select a resource from the list to modify</h2>
        {/* `p` is one of the elements `access.scss` sizes, so the module's own
            14px/20px has to be restated here. */}
        <p className="mb-4 text-[14px]/[20px] italic text-[#666]">
          Drag items to reorder the list.
        </p>

        {/* `w-full max-w-md mx-auto p-4` used to be inert — xras_admin never
            loaded Tailwind — so the list ran the full width of the page. */}
        <div>
          {/* `.nav.nav-tabs`: tabs overlapping the container's bottom border,
              4px rounded at the top only, and `cursor: default` because the
              theme's tabs are not links to anywhere. */}
          <div className="mb-5 flex border-b border-[#ddd]">
            {[ACTIVE_TAB, INACTIVE_TAB].map((tabName) => (
              <button
                key={tabName}
                type="button"
                className={cn(
                  "-mb-px mr-[2px] block cursor-default rounded-t-[4px] border px-3 py-2 text-left",
                  "bg-transparent text-[14px]/[20px] font-normal",
                  activeTab === tabName
                    ? "border-[#ddd] border-b-transparent bg-white text-[#555]"
                    : "border-transparent text-[#2fa4e7]",
                )}
                onClick={(e) => handleTabChange(tabName, e)}
              >
                {tabName}
              </button>
            ))}
          </div>

          <div className="m-0 list-none p-0">
            <div className="mb-2 flex justify-between rounded-[4px] bg-[#e0e0e0] p-2 font-bold">
              <span>Resource Name</span>
              <span>Repository Key</span>
            </div>
            {resources.map((resource, index) => (
              <div
                key={resource.resource_id}
                className="mb-[0.3rem] flex cursor-move items-center justify-between rounded-[4px] bg-[#f9f9f9] p-2 transition-colors last:mb-0 hover:bg-[#f0f0f0]"
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={handleDrop}
              >
                <span
                  className="mr-[15px] inline-block h-4 w-[15px] shrink-0 bg-[linear-gradient(to_bottom,#999_20%,transparent_20%,transparent_40%,#999_40%,#999_60%,transparent_60%,transparent_80%,#999_80%)]"
                  aria-hidden
                />
                <span className="grow-[2]">
                  <a
                    href={`${relativeUrlRoot}/resources/${resource.resource_id}`}
                    className="font-normal text-[#0066cc] no-underline hover:underline"
                  >
                    {resource.display_resource_name}
                  </a>
                </span>
                <span className="grow text-right text-[#808080]">
                  {resource.resource_repository_key || "N/A"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {showImportModal && (
        <ImportResourceModal onClose={() => setShowImportModal(false)} />
      )}
    </>
  );
}
