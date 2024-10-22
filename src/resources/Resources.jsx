import React, { useState, useMemo, useRef, useEffect } from "react";
import styles from './Resources.module.scss';
import { updateBackend } from './helpers/actions';
import { sortResources, startScrolling, stopScrolling } from './helpers/utils';

export default function Resources({ available_resources, relative_url_root }) {
    const sortedResources = useMemo(() => sortResources(available_resources), [available_resources]);
    const [resources, setResources] = useState(sortedResources);
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
        updateBackend(relative_url_root, resources);
    };

    useEffect(() => {
        return () => stopScrolling(scrollIntervalRef);
    }, []);

    const ResourceItem = ({ resource, index }) => {
        const [isDragging, setIsDragging] = useState(false);

        return (
            <div
                className={`${styles['resources-item']} ${isDragging ? styles.dragging : ''}`}
                draggable
                onDragStart={(e) => {
                    setIsDragging(true);
                    handleDragStart(e, index);
                }}
                onDragEnd={() => {
                    setIsDragging(false);
                    stopScrolling(scrollIntervalRef);
                }}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => {
                    setIsDragging(false);
                    handleDrop();
                }}
            >  
                <span className={styles['drag-handle']}></span>
                <span className={styles['resource-name']}>
                    <a href={`${relative_url_root}/resources/${resource.resource_id}`} className={styles['resource-link']}>
                        {resource.display_resource_name}
                    </a>
                </span>
            </div>
        );
    };

    return (
        <div className={styles['resources-container']}>
            <h2>Select a resource from the list to modify</h2>
            <p>
                Only resource submission questions can be modified in XRAS Admin. For all other resource information use the{" "}
                <a href="https://cider.access-ci.org">ACCESS CyberInfrastructure Description Repository</a>
            </p>
            <p className={styles['drag-instruction']}>Drag items to reorder the list.</p>
            <div className={styles['resources-list']}>
                {resources.map((resource, index) => (
                    <ResourceItem key={resource.resource_id} resource={resource} index={index} />
                ))}
            </div>
        </div>
    );
}