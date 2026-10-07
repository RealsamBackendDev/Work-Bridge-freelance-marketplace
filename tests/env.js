process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  "postgresql://workbridge:workbridge_test@localhost:5433/workbridge_test?schema=public";
process.env.JWT_ACCESS_SECRET = "test_access_secret_12345678901234567890";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret_12345678901234567890";
process.env.CORS_ORIGIN = "http://localhost:5173";
process.env.OTP_EXPIRES_MINUTES = "10";