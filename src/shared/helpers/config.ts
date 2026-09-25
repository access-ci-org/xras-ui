const config = {
  creditAlertThreshold: 1000,
  resourceTypeIcons: {
    credit: "cash-coin",
    compute: "cpu-fill",
    storage: "hdd-fill",
    program: "person-square",
  } as Record<string, string>,
  roleIcons: {
    PI: "person-fill-check",
    "Co-PI": "person-fill-add",
    "Allocation Manager": "person-fill-gear",
    User: "people-fill",
  } as Record<string, string>,
};

export default config;
