export enum LoginFlowEndpoints {
  LOGIN = '/api/auth/login',
  REGISTER = '/api/auth/register',
  USER_UPDATE = '/api/auth/user/update',
  USER_ME = '/api/auth/user/me',
}

export enum MeasurementEndpoints {
  ADD_MEASUREMENT = '/api/measurement/add',
  GET_MEASUREMENT = '/api/measurement/getAll',
  GET_ONE_MEASUREMENT = '/api/measurement',
  UPDATE_MEASUREMENT = '/api/measurement',
  DELETE_MEASUREMENT = '/api/measurement',
}

export enum CycleEndpoints {
  GET_ALL_CYCLES = '/api/cycle/getAll',
  GET_CYCLE = '/api/cycle/get/',
  ADD_CYCLE = '/api/cycle/add',
  UPDATE_CYCLE = '/api/cycle/update/',
  DELETE_CYCLE = '/api/cycle/delete/',
}
