import { useState, useMemo, useRef, useEffect } from "react";
import { updateBackend } from "./helpers/actions";
import { sortResources, startScrolling, stopScrolling } from "./helpers/utils";
import styles from "./Resources.module.scss";

import { AddNewModal } from "../edit-resource/AddNewModal";
import ImportResource from "./ImportResource";

export default function Resources({ availableResources, relativeUrlRoot }) {
  const sortedResources = useMemo(
    () => sortResources(availableResources),
    [availableResources]
  );
  const [resources, setResources] = useState(sortedResources);
  const [showImportModal, setShowImportModal] = useState(false);
  const [canSaveImport, setCanSaveImport] = useState(false);

  const draggedIndexRef = useRef(null);
  const scrollIntervalRef = useRef(null);

  useEffect(() => {
    setResources(sortedResources);
  }, [sortedResources]);

  const handleDragStart = (e, index) => {
    draggedIndexRef.current = index;
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndexRef.current === index) return;

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
      <div className={styles["resources-container"]}>
        <button
          className="btn btn-primary pull-right"
          onClick={() => setShowImportModal(true)}
        >
          Add a Resource from CIDeR
        </button>
        <h2>Select a resource from the list to modify</h2>
        <p className={styles["drag-instruction"]}>
          Drag items to reorder the list.
        </p>
        <div className={styles["resources-list"]}>
          <div className={styles["resources-header"]}>
            <span className={styles["header-name"]}>Resource Name</span>
            <span className={styles["header-repo"]}>Repository Key</span>
          </div>
          {resources.map((resource, index) => (
            <div
              key={resource.resource_id}
              className={`${styles["resources-item"]}`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={handleDrop}
            >
              <span className={styles["drag-handle"]}></span>
              <span className={styles["resource-name"]}>
                <a
                  href={`${relativeUrlRoot}/resources/${resource.resource_id}`}
                  className={styles["resource-link"]}
                >
                  {resource.display_resource_name}
                </a>
              </span>
              <span className={styles["resource-repo"]}>
                {resource.resource_repository_key || "N/A"}
              </span>
            </div>
          ))}
        </div>
      </div>
      <AddNewModal
        show={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Add a Resource from CIDeR"
        onSave={() => console.log("Save")}
        buttonText={"Save"}
        canSave={canSaveImport}
      >
        {showImportModal && <ImportResource setCanSave={setCanSaveImport} />}
      </AddNewModal>
    </>
  );
}
