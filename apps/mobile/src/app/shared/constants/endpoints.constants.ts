export enum LoginFlowEndpoints {
  LOGIN = '/api/auth/login',
  REGISTER = '/api/auth/register',
  USER_UPDATE = '/api/auth/user/update',
}

export enum MeasurementEndpoints {
  ADD_MEASUREMENT = '/api/measurement/add',
  GET_MEASUREMENT = '/api/measurement/getAll',
}

export enum CycleEndpoints {
  GET_CYCLE = '/api/cycle/get/',
  ADD_CYCLE = '/api/cycle/add',
  UPDATE_CYCLE = '/api/cycle/update/',
  DELETE_CYCLE = '/api/cycle/delete/',
}
