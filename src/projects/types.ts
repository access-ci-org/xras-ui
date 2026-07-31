export type ExchangeRateInfo = {
  endDate?: string | null;
  type: string;
  unitCost: number;
};

export type ResourceQuestionAttribute = {
  required: boolean;
  resourceAttributeId: number;
  label: string;
};

export type ResourceQuestion = {
  attributeSetId: number;
  attributes: ResourceQuestionAttribute[];
  fieldType: string;
  label: string;
  resourceId: number;
  values: (number | string)[];
};

export type Resource = {
  allocated: number;
  decimalPlaces: number;
  endDate?: string | null;
  exchangeRates: {
    base: ExchangeRateInfo;
    current: ExchangeRateInfo;
  };
  icon: string;
  isActive: boolean;
  isBoolean: boolean;
  isCredit: boolean;
  isFake: boolean;
  isUnderReview: boolean;
  isNew: boolean;
  minimumExchange: number;
  name: string;
  questions?: ResourceQuestion[];
  requires?: number[];
  resourceProvider: {
    organizationId?: number | string;
    name: string;
    favicon?: string;
  };
  requested: number;
  resourceId: number;
  resourceRepositoryKey?: string;
  startDate?: string | null;
  type?: string;
  unit: string;
  used: number;
  userGuideUrl?: string | null;
};

export type Action = {
  actionId: number;
  allowedOperations: string[];
  detailAvailable: boolean;
  date: string;
  deleteStatus: string | null;
  isRequest: boolean;
  resources: Resource[];
  showDeleteModal: boolean;
  status: string;
  type: string;
  returnedForCorrections?: boolean;
  adminComments?: string;
};

export type AllowedAction = {
  name: string;
  resources: Resource[];
  opportunityId?: number;
  opportunityName?: string;
};

export type AllowedActionsMap = Record<string, AllowedAction | AllowedAction[]>;

export type RequestListItem = {
  allocationType: string;
  endDate?: string | null;
  entryDate: string;
  requestId: number;
  startDate?: string | null;
  status: string;
};

export type Request = {
  actions: Action[];
  allocationType: string;
  allowedActions: AllowedActionsMap;
  endDate?: string | null;
  entryDate: string;
  exchangeActionId: number | null;
  exchangeActionEditable: boolean;
  exchangeErrors: string[];
  exchangeStatus: string | null;
  grantNumber: string;
  isMaximize: boolean;
  requestId: number;
  resources: Resource[];
  resourcesReason: string;
  returnedForCorrections: boolean;
  returnedForCorrectionsNotes: string;
  showActionsModal: boolean;
  showConfirmModal: boolean;
  showResourcesModal: boolean;
  startDate?: string | null;
  status: string;
  timeStatus: string;
  type: string;
  usageDetail: UsageDetail | null;
  usageDetailStatus: string | null;
  usesCredits: boolean;
  error?: string;
};

export type UsageDetailUser = {
  firstName: string;
  lastName: string;
  portalUsername: string;
  role: string;
  lastWeek: number;
  lastMonth: number;
  lastQuarter: number;
  currentRequest: number;
  total: number;
};

export type UsageDetail = {
  projectTitle: string;
  resourceDisplayName: string;
  resourceRepositoryKey: string;
  users: UsageDetailUser[];
};

export type User = {
  eligibility: string;
  eligibilityReason?: string;
  email?: string;
  firstName: string;
  initialResourceIds: number[];
  initialRole: string;
  lastName: string;
  organization?: string;
  resourceAccountPendingIds: number[];
  resourceAccountInactiveIds: number[];
  resourceIds: number[];
  resourceUsernames: Record<number, string>;
  role: string;
  username: string;
  hasChanges?: boolean;
  isNew?: boolean;
};

export type Project = {
  currentRequestId: number | null;
  grantNumber: string;
  isManager: boolean;
  requestsList: RequestListItem[];
  selectedRequestId: number;
  status: string;
  tab: string;
  title: string;
  users: User[];
  usersNewRowIndex: number;
  usersStatus: string | null;
  usersErrors?: string[];
  currentUser?: User;
  error?: string;
};

export type ProjectListEntry = {
  grantNumber: string;
  status: string;
  title: string;
};

export type SearchedUser = {
  eligibility: string;
  eligibilityReason?: string;
  email?: string;
  firstName: string;
  lastName: string;
  username: string;
  organization?: string;
};
