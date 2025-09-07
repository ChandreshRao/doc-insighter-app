export const environment = {
  production: true,
  apiUrl: process.env['API_URL'] || 'https://api.doc-insight.com/api',
  authUrl: process.env['AUTH_URL'] || 'https://api.doc-insight.com/api/auth',
  frontendUrl: process.env['FRONTEND_URL'] || 'https://doc-insight.com',
  ragServiceUrl: process.env['RAG_SERVICE_URL'] || 'https://rag.doc-insight.com',
  appName: process.env['APP_NAME'] || 'Doc Insight Portal',
  version: process.env['APP_VERSION'] || '1.0.0'
};
