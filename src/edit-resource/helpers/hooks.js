import { useCallback, useEffect, useReducer, useState } from "react";
import { resources } from "./reducers";
import {
  setLoading,
  setResourceData,
  setSuccessMessage,
  updateAllocation,
} from "./actions";
import { fetchResourceData, updateResourceData } from "./utils";

export const useResourceData = (resourceId, relativeUrlRoot) => {
  const [state, dispatch] = useReducer(resources, {
    resourceData: null,
    loading: true,
    errors: [],
    successMessage: { message: "", color: "" },
  });

  const handleError = useCallback(async (response, defaultMessage) => {
    let errors = [defaultMessage];
    try {
      const errorData = await response.json();
      if (errorData.errors) {
        errors = errorData.errors;
      } else if (errorData.message) {
        errors = [errorData.message];
      }
    } catch (parseError) {
      console.error("Error parsing error response:", parseError);
    }
    dispatch({ type: "SET_ERRORS", payload: errors });
  }, []);

  const fetchData = useCallback(async () => {
    dispatch(setLoading(true));
    try {
      const data = await fetchResourceData(resourceId, relativeUrlRoot);
      dispatch(setResourceData(data));
    } catch (error) {
      console.error("Failed to fetch resource data:", error);
      dispatch({
        type: "SET_ERRORS",
        payload: "Failed to fetch resource data. Please try again later.",
      });
    }
  }, [resourceId, relativeUrlRoot]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { state, dispatch, handleError, fetchData };
};

export const useResourceOptions = (resourceData) => {
  return {
    allowedActionsOptions:
      resourceData?.resource_state_types_available?.map((state) => ({
        value: state.resource_state_type_id,
        label: state.display_resource_state_type,
        additionalInfo: state.action_types
          .map((action) => action.display_action_type)
          .join(", "),
      })) || [],

    resourceTypesOptions:
      resourceData?.resource_types_available?.map((type) => ({
        value: type.resource_type_id,
        label: type.display_resource_type,
      })) || [],

    unitTypesOptions:
      resourceData?.unit_types_available?.map((type) => ({
        value: type.unit_type_id,
        label: type.display_unit_type,
      })) || [],

    availableResources: resourceData?.required_resources_available || [],

    availableAllocationTypes: resourceData?.unassigned_allocation_types || [],
  };
};

export const useAllocationRowsAndColumns = (
  resourceDetails,
  availableResources,
  selectedNewResource,
  allowedActionsOptions,
  handleAllowedActionChange,
  handleCommentChange,
  handleRequiredResourceChange
) => {
  const requiredResourcesColumns = () => {
    if (!resourceDetails) return [];

    const requiredResources = new Set();
    resourceDetails.allocation_types?.forEach((type) => {
      type.required_resources?.forEach((resource) => {
        requiredResources.add(resource.resource_name);
      });
    });

    return Array.from(requiredResources)
      .sort((a, b) => a.localeCompare(b))
      .map((resourceName) => ({
        key: resourceName,
        name: `Require ${resourceName}`,
        width: 150,
        type: "checkbox",
      }));
  };

  const generatedColumns = requiredResourcesColumns();

  const allocationColumns = [
    { key: "display_name", name: "Allocation Type", width: 200 },
    {
      key: "allowed_actions",
      name: "Allowed Actions",
      width: 200,
      type: "select",
    },
    {
      key: "comment",
      name: "Descriptive Text",
      width: 200,
      type: "input",
      tooltip:
        "Appears below the resource name and allocations description in the form when making a new request",
    },
    ...generatedColumns,
  ];

  const allocationRows = () => {
    if (!resourceDetails?.allocation_types) return [];

    return resourceDetails.allocation_types.map((type) => ({
      display_name: type.display_name,
      allocation_type_id: type.allocation_type_id,
      allowed_actions: {
        options: allowedActionsOptions,
        value: type.allowed_action?.resource_state_type_id || "",
        onChange: (newValue) =>
          handleAllowedActionChange(type.allocation_type_id, newValue),
      },
      comment: {
        value: type.comment || "",
        onChange: (newValue) =>
          handleCommentChange(type.allocation_type_id, newValue),
      },
      ...Object.fromEntries(
        generatedColumns.map((column) => [
          column.key,
          {
            checked:
              type.required_resources?.some(
                (resource) => resource.resource_name === column.key
              ) || false,
            onChange: (newValue) =>
              handleRequiredResourceChange(
                type.allocation_type_id,
                column.key,
                newValue,
                type
              ),
          },
        ])
      ),
    }));
  };

  return {
    allocationColumns,
    allocationRows: allocationRows(),
    requiredResourcesColumns: generatedColumns,
  };
};

export const useAllocationGrid = (resourceData, resourceDetails, dispatch) => {
  const {
    availableResources,
    availableAllocationTypes,
    allowedActionsOptions,
  } = useResourceOptions(resourceData);
  const [showAddResourceModal, setShowAddResourceModal] = useState(false);
  const [showAddAllocationTypeModal, setShowAddAllocationTypeModal] =
    useState(false);
  const [selectedNewResource, setSelectedNewResource] = useState([]);
  const [selectedNewAllocationType, setSelectedNewAllocationType] =
    useState("");

  // memoized handlers for allocation updates
  const handleAllowedActionChange = useCallback(
    (allocationTypeId, newValue) => {
      dispatch(
        updateAllocation(allocationTypeId, {
          allowed_action: {
            resource_state_type_id: newValue,
          },
        })
      );
    },
    [dispatch]
  );

  const handleCommentChange = useCallback(
    (allocationTypeId, newValue) => {
      dispatch(updateAllocation(allocationTypeId, { comment: newValue }));
    },
    [dispatch]
  );

  const handleRequiredResourceChange = useCallback(
    (allocationTypeId, resourceName, newValue, type) => {
      const updatedRequiredResources = newValue
        ? [
            ...(type.required_resources || []),
            {
              resource_name: resourceName,
              required_resource_id:
                resourceData.required_resources_available.find(
                  (r) => r.resource_name === resourceName
                ).resource_id,
            },
          ]
        : (type.required_resources || []).filter(
            (resource) => resource.resource_name !== resourceName
          );

      dispatch(
        updateAllocation(allocationTypeId, {
          required_resources: updatedRequiredResources,
        })
      );
    },
    [resourceData, dispatch]
  );

  // Populate selectedNewResource with the current required resources when the modal is opened
  useEffect(() => {
    if (showAddResourceModal && resourceDetails) {
      const existingRequiredResources = resourceDetails.allocation_types
        .flatMap((type) => type.required_resources || [])
        .map((resource) => resource.required_resource_id);
      setSelectedNewResource(existingRequiredResources);
    }
  }, [showAddResourceModal, resourceDetails]);

  const handleSelectNewResource = useCallback((resourceId, checked) => {
    setSelectedNewResource(
      (prevSelected) =>
        checked
          ? [...prevSelected, resourceId] // Add resource if checked
          : prevSelected.filter((id) => id !== resourceId) // Remove resource if unchecked
    );
  }, []);

  const handleSaveResources = useCallback(() => {
    // existing Required Resources
    const initialRequiredResources = resourceDetails.allocation_types
      .flatMap((type) => type.required_resources || [])
      .map((resource) => resource.required_resource_id);

    const addedResources = selectedNewResource.filter(
      (id) => !initialRequiredResources.includes(id)
    );
    const removedResources = initialRequiredResources.filter(
      (id) => !selectedNewResource.includes(id)
    );

    const updatedAllocationTypes = resourceDetails.allocation_types.map(
      (type) => {
        const currentRequiredResources = type.required_resources || [];

        // Add new resources
        const newResourcesToAdd = addedResources.map((resourceId) => {
          const resource = availableResources.find(
            (r) => r.resource_id === resourceId
          );
          return {
            resource_name: resource.resource_name,
            required_resource_id: resource.resource_id,
          };
        });

        // Remove unchecked resources
        const updatedRequiredResources = currentRequiredResources
          .filter(
            (resource) =>
              !removedResources.includes(resource.required_resource_id)
          )
          .concat(
            newResourcesToAdd.filter(
              (newRes) =>
                !currentRequiredResources.some(
                  (curRes) =>
                    curRes.required_resource_id === newRes.required_resource_id
                )
            )
          );

        return {
          ...type,
          required_resources: updatedRequiredResources,
        };
      }
    );

    dispatch(
      setResourceData({
        ...resourceData,
        resource_details: {
          ...resourceDetails,
          allocation_types: updatedAllocationTypes,
        },
      })
    );

    setSelectedNewResource([]);
    setShowAddResourceModal(false);
  }, [
    selectedNewResource,
    availableResources,
    resourceDetails,
    resourceData,
    dispatch,
  ]);

  const handleSelectNewAllocationType = useCallback((e) => {
    const newAllocationTypeValue = e.target.value;
    setSelectedNewAllocationType(newAllocationTypeValue);
  }, []);

  const handleSaveAllocationType = useCallback(() => {
    if (!selectedNewAllocationType) return;

    const newAllocationType = availableAllocationTypes.find(
      (at) => at.allocation_type_id.toString() === selectedNewAllocationType
    );

    const isAllocationTypeExisting = resourceDetails.allocation_types?.some(
      (type) => type.allocation_type_id === newAllocationType.allocation_type_id
    );

    if (newAllocationType && !isAllocationTypeExisting) {
      // Set the first one in the list as the default resource state type
      const defaultResourceStateType = allowedActionsOptions[0]?.value;

      const updatedAllocationTypes = [
        ...(resourceDetails.allocation_types || []),
        {
          allocation_type_id: newAllocationType.allocation_type_id,
          display_name: newAllocationType.display_name,
          allowed_action: {
            resource_state_type_id: defaultResourceStateType,
          },
          comment: "",
          required_resources: [],
        },
      ];

      dispatch(
        setResourceData({
          ...resourceData,
          resource_details: {
            ...resourceDetails,
            allocation_types: updatedAllocationTypes,
          },
        })
      );

      setShowAddAllocationTypeModal(false);
    }
  }, [
    selectedNewAllocationType,
    availableAllocationTypes,
    resourceDetails,
    resourceData,
    dispatch,
    allowedActionsOptions,
  ]);

  return {
    showAddResourceModal,
    setShowAddResourceModal,
    showAddAllocationTypeModal,
    setShowAddAllocationTypeModal,
    selectedNewResource,
    handleSelectNewResource,
    handleSaveResources,
    selectedNewAllocationType,
    handleSelectNewAllocationType,
    handleSaveAllocationType,
    handleAllowedActionChange,
    handleCommentChange,
    handleRequiredResourceChange,
  };
};

export const useResourceSubmit = (
  resourceDetails,
  resourceId,
  relativeUrlRoot,
  fetchData,
  handleError,
  dispatch
) => {
  return useCallback(async () => {
    if (!resourceDetails) return;

    const updatedResource = {
      resource_name: resourceDetails.resource_name,
      description: resourceDetails.description,
      resource_type_id: resourceDetails.resource_type_id,
      unit_type_id: resourceDetails.unit_type_id,
      dollar_value: resourceDetails.dollar_value,
      allocation_types: resourceDetails.allocation_types.map((type) => ({
        allocation_type_id: type.allocation_type_id,
        allowed_action: {
          resource_state_type_id: type.allowed_action?.resource_state_type_id,
        },
        comment: type.comment || "",
      })),
      exchange_rates: {
        base_rate: resourceDetails.exchange_rates?.base_rate,
        discount_rates: resourceDetails.exchange_rates?.discount_rates?.map(
          (rate) => ({
            id: rate.id,
            exchange_rate: rate.exchange_rate,
            begin_date: rate.begin_date,
            end_date: rate.end_date,
          })
        ),
      },
    };

    const requiredResources = {};
    resourceDetails.allocation_types.forEach((type) => {
      type.required_resources.forEach((resource) => {
        if (!requiredResources[resource.required_resource_id]) {
          requiredResources[resource.required_resource_id] = [];
        }
        requiredResources[resource.required_resource_id].push(
          type.allocation_type_id
        );
      });
    });

    try {
      const response = await updateResourceData(
        resourceId,
        relativeUrlRoot,
        updatedResource,
        requiredResources
      );
      if (response.ok) {
        const result = await response.json();
        dispatch(
          setSuccessMessage(
            result.message || "Resource updated successfully!",
            "success"
          )
        );
        await fetchData();
        return true;
      } else {
        await handleError(response, "Failed to update resource");
        return false;
      }
    } catch (error) {
      dispatch(
        setSuccessMessage(
          "Error updating resource. Please try again later.",
          "danger"
        )
      );
      return false;
    }
  }, [resourceDetails, resourceId, relativeUrlRoot, fetchData, handleError]);
};
