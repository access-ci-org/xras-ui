import { useState, useMemo, useRef, useEffect } from "react";
import { updateBackend } from "./helpers/actions";
import { sortResources, startScrolling, stopScrolling } from "./helpers/utils";
import styles from "./Resources.module.scss";

import ImportResourceModal from "./ImportResourceModal";

export default function Resources({
  availableResources, unavailableResources = [],
  canAdd = false,
  relativeUrlRoot,
}) {
  const sortedAvailableResources = useMemo(
    () => sortResources(availableResources),
    [availableResources]
  );
  const sortedUnavailableResources = useMemo(
      () => sortResources(unavailableResources),
      [unavailableResources]
  );
  const [resources, setResources] = useState(sortedAvailableResources);
  const [showImportModal, setShowImportModal] = useState(false);

  const draggedIndexRef = useRef(null);
  const scrollIntervalRef = useRef(null);
  const activeResourcesTabName = 'Active'
  const inactiveResourcesTabName = 'Inactive'
  const [activeTab, setActiveTab] = useState(activeResourcesTabName);


  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
    console.log(tabName)
    if(tabName == activeResourcesTabName) {
      setResources(sortedAvailableResources)
    } else {
      setResources(sortedUnavailableResources)
    }
  };

  function handleTabChange(tabName, e) {
    e.preventDefault();
    setActiveTab(tabName);
    handleTabClick(tabName);
  };

  useEffect(() => {
    setResources(sortedAvailableResources);
  }, [sortedAvailableResources]);

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
        {canAdd && (
          <button
            className="btn btn-primary pull-right"
            onClick={() => setShowImportModal(true)}
          >
            Add a Resource from CIDeR
          </button>
        )}
        <h2>Select a resource from the list to modify</h2>
        <p className={styles["drag-instruction"]}>
          Drag items to reorder the list.
        </p>

        <div className="w-full max-w-md mx-auto p-4">
          <ul className="nav nav-tabs">
            <li className="nav-item">
              <a
                  className={`nav-link ${activeTab === activeResourcesTabName ? 'active' : ''}`}
                  data-toggle={activeTab === activeResourcesTabName ? "tab" : undefined}
                  style={{
                    cursor: 'default',
                    ...(activeTab === activeResourcesTabName ? {
                      border: '1px solid #ddd',
                      borderBottomColor: 'transparent',
                      color: '#555',
                      backgroundColor: '#fff'
                    } : {})
                  }}
                  onClick={(e) => handleTabChange(activeResourcesTabName, e)}
              >
                {activeResourcesTabName}
              </a>
            </li>
            <li className="nav-item">
              <a
                  className={`nav-link ${activeTab === inactiveResourcesTabName ? 'active' : ''}`}
                  data-toggle={activeTab === inactiveResourcesTabName ? "tab" : undefined}
                  style={{cursor: 'default'}}
                  onClick={(e) => handleTabChange(inactiveResourcesTabName, e)}
              >
                {inactiveResourcesTabName}
              </a>
            </li>
          </ul>

          {/* Tab Content: List of Names */}
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




      </div>
      {showImportModal && (
        <ImportResourceModal onClose={() => setShowImportModal(false)} />
      )}
    </>
  );
}
