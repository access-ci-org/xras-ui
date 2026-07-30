export type ExchangeRateSnapshot = {
  unitCost: number;
  endDate?: string | null;
  institutionType?: string | null;
};

export type ResourceProvider = {
  name: string;
  favicon?: string;
};

export type Resource = {
  name: string;
  icon: string;
  unit: string;
  isCredit?: boolean;
  isActive?: boolean;
  isBoolean?: boolean;
  userGuideUrl?: string | null;
  allocated?: number;
  used?: number;
  requested?: number;
  exchangeRates: {
    base: ExchangeRateSnapshot;
    current: ExchangeRateSnapshot;
  };
  resourceProvider?: ResourceProvider;
};

export type RequestSummary = {
  allocationType: string;
  startDate?: string | null;
  endDate?: string | null;
  entryDate: string;
  status: string;
};

export type ProjectUser = {
  role: "pi" | "co_pi" | "allocation_manager" | "user" | string;
  firstName: string;
  lastName: string;
};

export type ProjectSummary = {
  users: ProjectUser[];
};

export type XrasUser = {
  firstName: string;
  lastName: string;
  organization?: string | null;
  email?: string | null;
};
