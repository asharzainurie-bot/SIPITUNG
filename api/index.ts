import app from '../server';

export default async function handler(req: any, res: any) {
  try {
    // Add global CORS headers for Vercel Serverless Function responses
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // Standardize URL path for Express routing
    if (req.url && !req.url.startsWith('/api/') && req.url !== '/api') {
      req.url = '/api' + (req.url.startsWith('/') ? '' : '/') + req.url;
    }

    return app(req, res);
  } catch (err: any) {
    console.error('[Vercel Serverless Handler Error]', err);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: err.message || 'Internal Server Error'
      });
    }
  }
}
