export const API = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    updateUser: '/api/auth/user/update',
    me: '/api/auth/user/me',
  },
  measurement: {
    byCycle: (cycleId: string) => `/api/measurement/getAll/${cycleId}`,
    create: (cycleId: string) => `/api/measurement/add/${cycleId}`,
    byId: (id: string) => `/api/measurement/${id}`,
  },
  cycle: {
    list: '/api/cycle/getAll',
    create: '/api/cycle/add',
    byId: (id: string) => `/api/cycle/get/${id}`,
    update: (id: string) => `/api/cycle/update/${id}`,
    delete: (id: string) => `/api/cycle/delete/${id}`,
  },
} as const;
