import React, { useState, useCallback, useMemo } from "react";

export default function Resources({ available_resources }) {
    // Sort resources by relative_order, then by resource_name for those with null relative_order
    const sortedResources = useMemo(() => {
        return [...available_resources].sort((a, b) => {
            if (a.relative_order === null && b.relative_order === null) {
                return a.resource_name.localeCompare(b.resource_name);
            }
            if (a.relative_order === null) return 1;
            if (b.relative_order === null) return -1;
            return a.relative_order - b.relative_order;
        });
    }, [available_resources]);

    const [resources, setResources] = useState(sortedResources);
    const [draggedItem, setDraggedItem] = useState(null);

    const onDragStart = useCallback((e, index) => {
        setDraggedItem(resources[index]);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/html", e.target.parentNode);
        e.dataTransfer.setDragImage(e.target.parentNode, 20, 20);
    }, [resources]);

    const onDragOver = useCallback((index) => {
        const draggedOverItem = resources[index];

        if (draggedItem === draggedOverItem) {
            return;
        }

        const items = resources.filter(item => item !== draggedItem);
        items.splice(index, 0, draggedItem);

        setResources(items);
    }, [resources, draggedItem]);

    const onDragEnd = useCallback(() => {
        setDraggedItem(null);
        updateBackend(resources);
    }, [resources]);

    const updateBackend = async (updatedResources) => {
        try {
            const response = await fetch(`/resources/${updatedResources[0].resource_id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
                },
                body: JSON.stringify({
                    resources: updatedResources.map((resource, index) => ({
                        resource_id: resource.resource_id,
                        relative_order: index + 1
                    }))
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update resource order');
            }

            const result = await response.json();
            console.log(result.message);
        } catch (error) {
            console.error('Error updating resource order:', error);
        }
    };

    return (
        <div>
            <h2>Select a resource to add/edit questions asked during submission</h2>
            <p>
                Only resource submission questions can be modified in XRAS Admin. For all other resource information use the{" "}
                <a href="https://cider.access-ci.org">ACCESS CyberInfrastructure Description Repository</a>
            </p>
            <ul>
                {resources.map((resource, index) => (
                    <li 
                        key={resource.resource_id}
                        draggable
                        onDragStart={(e) => onDragStart(e, index)}
                        onDragOver={() => onDragOver(index)}
                        onDragEnd={onDragEnd}
                        style={{ cursor: 'move' }}
                    >
                        
                        <a href={`/resources/${resource.resource_id}`}>{resource.display_resource_name}</a>
                    </li>
                ))}
            </ul>
        </div>
    );
}