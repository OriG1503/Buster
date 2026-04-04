const API_BASE = '/api';

export const API_ROUTES = {
  auth: {
    me: `${API_BASE}/auth/me`,
  },

  conflicts: {
    list: `${API_BASE}/conflicts`,
    count: `${API_BASE}/conflicts/count`,
    entity: `${API_BASE}/conflicts/entity`,
    openIds: `${API_BASE}/conflicts/open-ids`,
    resolveValue: `${API_BASE}/conflicts/value/resolve`,
    resolveRelational: `${API_BASE}/conflicts/relational/resolve`,
    resolveCrossEntity: `${API_BASE}/conflicts/cross-entity/resolve`,
    history: `${API_BASE}/conflicts/value/history`,
    relationalHistory: `${API_BASE}/conflicts/relational/history`,
    revert: `${API_BASE}/conflicts/value/revert`,
    crossEntityHistory: `${API_BASE}/conflicts/cross-entity/history`,
    revertCrossEntity: `${API_BASE}/conflicts/cross-entity/revert`,
  },

  entityCatalog: {
    config: `${API_BASE}/entity-catalog`,
  },

  file: {
    upload: `${API_BASE}/file`,
    report: (fileName: string) => `${API_BASE}/file/report/${fileName}`,
  },

  tableView: {
    query: `${API_BASE}/table-view`,
  },
};
