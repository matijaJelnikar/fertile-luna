export const jwtConstants = {
  secret: process.env.JWT_SECRET || 'defaultSecretKey', // Uses existing JWT_SECRET from .env
};
