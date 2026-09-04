import { useEffect, useMemo } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { selectAtom } from "jotai/utils";
import {
  addResourceAtom,
  addUserAtom,
  apiStateAtom,
  closeGrantModalAtom,
  closeUsageDetailModalAtom,
  deleteActionAtom,
  editGrantAtom,
  errorAtom,
  fetchProjectDetailAtom,
  fetchProjectsListAtom,
  fetchRequestDetailAtom,
  fetchUsageDetailAtom,
  projectListLoadingAtom,
  projectsListAtom,
  resetResourcesAtom,
  resetUsersAtom,
  saveGrantAtom,
  saveResourcesAtom,
  saveUsersAtom,
  setRequestAtom,
  setResourceQuestionValuesAtom,
  setResourceRequestAtom,
  setResourcesReasonAtom,
  setTabAtom,
  setUserRoleAtom,
  statuses,
  toggleActionsModalAtom,
  toggleConfirmModalAtom,
  toggleDeleteModalAtom,
  toggleResourcesModalAtom,
  toggleUsersResourcesAtom,
  usernameAtom,
  type GrantEdits,
} from "../atoms";
import type { SearchedUser } from "../types";

export const useProjectsList = (username: string) => {
  const error = useAtomValue(errorAtom);
  const loading = useAtomValue(projectListLoadingAtom);
  const projects = useAtomValue(projectsListAtom);
  const fetchProjectsList = useSetAtom(fetchProjectsListAtom);

  useEffect(() => {
    fetchProjectsList(username);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { error, loading, projects };
};

export const useProject = (grantNumber: string | null | undefined, skipFetch?: boolean) => {
  const projectSelector = useMemo(
    () => selectAtom(apiStateAtom, (state) => (grantNumber ? state.projects[grantNumber] : undefined)),
    [grantNumber],
  );
  const project = useAtomValue(projectSelector);
  const username = useAtomValue(usernameAtom);
  const fetchProjectDetail = useSetAtom(fetchProjectDetailAtom);
  const addUser = useSetAtom(addUserAtom);
  const resetUsers = useSetAtom(resetUsersAtom);
  const saveUsers = useSetAtom(saveUsersAtom);
  const setRequest = useSetAtom(setRequestAtom);
  const setTab = useSetAtom(setTabAtom);
  const setUserRole = useSetAtom(setUserRoleAtom);
  const toggleUsersResources = useSetAtom(toggleUsersResourcesAtom);

  useEffect(() => {
    if (grantNumber && !project && !skipFetch) fetchProjectDetail(grantNumber);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grantNumber, skipFetch]);

  return {
    project,
    addUser: (user: SearchedUser) => grantNumber && addUser({ grantNumber, user }),
    resetUsers: () => grantNumber && resetUsers({ grantNumber }),
    saveUsers: () => grantNumber && saveUsers({ grantNumber }),
    setRequest: (requestId: number) => grantNumber && setRequest({ grantNumber, requestId }),
    setTab: (tab: string) => grantNumber && setTab({ grantNumber, tab }),
    setUserRole: (username: string, role: string) => grantNumber && setUserRole({ grantNumber, username, role }),
    statuses,
    toggleUsersResources: (checked: boolean, username?: string | null, resourceId?: number | null) =>
      grantNumber && toggleUsersResources({ grantNumber, username, resourceId, checked }),
    username,
  };
};

export const useRequest = (requestId: number | string | null | undefined, grantNumber?: string | null) => {
  const requestSelector = useMemo(
    () => selectAtom(apiStateAtom, (state) => (requestId != null ? state.requests[requestId] : undefined)),
    [requestId],
  );
  const request = useAtomValue(requestSelector);
  const fetchRequestDetail = useSetAtom(fetchRequestDetailAtom);
  const addResource = useSetAtom(addResourceAtom);
  const closeGrantModal = useSetAtom(closeGrantModalAtom);
  const closeUsageDetailModal = useSetAtom(closeUsageDetailModalAtom);
  const deleteAction = useSetAtom(deleteActionAtom);
  const editGrant = useSetAtom(editGrantAtom);
  const fetchUsageDetail = useSetAtom(fetchUsageDetailAtom);
  const resetResources = useSetAtom(resetResourcesAtom);
  const saveGrant = useSetAtom(saveGrantAtom);
  const saveResources = useSetAtom(saveResourcesAtom);
  const setResourceQuestionValues = useSetAtom(setResourceQuestionValuesAtom);
  const setResourceRequest = useSetAtom(setResourceRequestAtom);
  const setResourcesReason = useSetAtom(setResourcesReasonAtom);
  const toggleActionsModal = useSetAtom(toggleActionsModalAtom);
  const toggleConfirmModal = useSetAtom(toggleConfirmModalAtom);
  const toggleDeleteModal = useSetAtom(toggleDeleteModalAtom);
  const toggleResourcesModal = useSetAtom(toggleResourcesModalAtom);

  useEffect(() => {
    if (requestId != null && !request) fetchRequestDetail(requestId as number);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grantNumber, requestId]);

  return {
    request,
    addResource: (resourceId: number) =>
      requestId != null && addResource({ requestId: requestId as number, resourceId }),
    closeGrantModal: () => requestId != null && closeGrantModal({ requestId: requestId as number }),
    closeUsageDetailModal: () => requestId != null && closeUsageDetailModal({ requestId: requestId as number }),
    deleteAction: (actionId: number) =>
      requestId != null && deleteAction({ actionId, requestId: requestId as number }),
    editGrant: (grantId: number) =>
      requestId != null && editGrant({ requestId: requestId as number, grantId }),
    openUsageDetailModal: (resourceRepositoryKey: string) =>
      request &&
      fetchUsageDetail({
        grantNumber: request.grantNumber,
        requestId: requestId as number,
        resourceRepositoryKey,
      }),
    resetResources: () => requestId != null && resetResources({ requestId: requestId as number }),
    saveGrant: (grantId: number, values: GrantEdits) =>
      requestId != null && saveGrant({ requestId: requestId as number, grantId, values }),
    saveResources: () => requestId != null && saveResources({ requestId: requestId as number }),
    setResourceQuestionValues: (resourceId: number, attributeSetId: number, values: (number | string)[]) =>
      requestId != null &&
      setResourceQuestionValues({ requestId: requestId as number, resourceId, attributeSetId, values }),
    setResourceRequest: (resourceId: number, requested: number) =>
      requestId != null && setResourceRequest({ requestId: requestId as number, resourceId, requested }),
    setResourcesReason: (reason: string) =>
      requestId != null && setResourcesReason({ requestId: requestId as number, reason }),
    statuses,
    toggleActionsModal: () => requestId != null && toggleActionsModal({ requestId: requestId as number }),
    toggleConfirmModal: () => requestId != null && toggleConfirmModal({ requestId: requestId as number }),
    toggleDeleteModal: (actionId: number) =>
      requestId != null && toggleDeleteModal({ requestId: requestId as number, actionId }),
    toggleResourcesModal: () => requestId != null && toggleResourcesModal({ requestId: requestId as number }),
  };
};
