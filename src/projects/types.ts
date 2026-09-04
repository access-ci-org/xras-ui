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
  /**
   * A decommissioned resource: it can still appear in a request that already
   * holds a balance, but that balance may only be exchanged *down*. Set from
   * the API's `negativeOnly` flag, defaulted to `false` - see `makeResource`
   * in atoms.ts.
   */
  negativeOnly: boolean;
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

export type Grant = {
  grantId: number;
  fundingAgencyId?: number | null;
  fundingAgencyName?: string | null;
  fundingAgencyAbbr?: string | null;
  grantNumber?: string | null;
  piName?: string | null;
  title?: string | null;
  beginDate?: string | null;
  endDate?: string | null;
  awardedAmount?: number | null;
  awardedUnits?: string | null;
  percentageAward?: number | null;
  programOfficerName?: string | null;
  programOfficerEmail?: string | null;
  isPending?: boolean | null;
  subAwardNumber?: string | null;
  comments?: string | null;
  primaryFosTypeId?: number | null;
  primaryFosType?: string | null;
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
  /**
   * Supporting grants attached to this request. `undefined` means the host
   * API predates the projects-payload grants attachment (an older
   * `V1::ProjectsController#get_projects` never sent the key at all) - Request.tsx
   * gates the Grants tab on this being present, not merely non-empty, the same
   * way it gates the Intl. Users tab on `internationalUserRequests`.
   */
  grants?: Grant[];
  /**
   * `grantId` of the grant whose edit modal is open, or null when it's closed.
   * The modal holds the in-progress values in its own form state, so `grants`
   * only ever contains saved values.
   */
  editGrantId?: number | null;
  grantsStatus?: string | null;
  grantsErrors?: string[];
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
  /**
   * Whether this user's role may be changed from the Users + Roles grid. The
   * API decides (a user with an open request of their own can't be demoted,
   * for instance); the grid only disables the select - see Users.tsx.
   */
  canChangeRoles?: boolean;
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

export type InternationalUserRequestSummary = {
  id: number;
  /**
   * The XRAS request the justification belongs to. Optional because it is only
   * as old as xras_submit_access commit 87e1f6d0 ("Added \"requestId\" to the
   * InternationalUserRequests hash") - this library is versioned separately
   * from the apps that mount it, so a host that hasn't picked that up still
   * sends only `id`/`status`/`submittedAt`/`reviewerComments`. See
   * InternationalUserRequest.tsx for what happens then.
   */
  requestId?: number;
  status: string;
  submittedAt?: string | null;
};

export type Project = {
  currentRequestId: number | null;
  grantNumber: string;
  /**
   * Present only for projects whose allocation requires International User
   * Justification forms; absent (not empty) otherwise, which is what gates
   * the "Intl. Users" tab in Request.tsx.
   */
  internationalUserRequests?: InternationalUserRequestSummary[] | null;
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
  canChangeRoles?: boolean;
  eligibility: string;
  eligibilityReason?: string;
  email?: string;
  firstName: string;
  lastName: string;
  username: string;
  organization?: string;
};
