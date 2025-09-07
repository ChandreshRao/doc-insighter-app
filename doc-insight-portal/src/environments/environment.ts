export const environment = {
  production: false,
  apiUrl: process.env['API_URL'] || 'http://localhost:3000/api',
  authUrl: process.env['AUTH_URL'] || 'http://localhost:3000/api/auth',
  frontendUrl: process.env['FRONTEND_URL'] || 'http://localhost:4200',
  ragServiceUrl: process.env['RAG_SERVICE_URL'] || 'http://localhost:8000',
  appName: process.env['APP_NAME'] || 'Doc Insight Portal',
  version: process.env['APP_VERSION'] || '1.0.0'
};
