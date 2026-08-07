import app from '../server';

export default function handler(req: any, res: any) {
  return new Promise((resolve, reject) => {
    try {
      // Add global CORS headers for Vercel Serverless Function responses
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

      if (req.method === 'OPTIONS') {
        res.status(200).end();
        resolve(true);
        return;
      }

      // Standardize URL path for Express routing when rewritten by Vercel
      if (req.query && req.query.path) {
        const pathStr = Array.isArray(req.query.path) ? req.query.path.join('/') : String(req.query.path);
        delete req.query.path;

        // Reconstruct remaining query parameters
        const queryParams = new URLSearchParams();
        for (const [key, val] of Object.entries(req.query)) {
          if (val !== undefined) {
            if (Array.isArray(val)) {
              val.forEach(v => queryParams.append(key, String(v)));
            } else {
              queryParams.append(key, String(val));
            }
          }
        }
        const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
        req.url = `/api/${pathStr.replace(/^\/+/, '')}${queryString}`;
      } else if (req.url) {
        if (req.url.startsWith('/api/index')) {
          const rawPath = req.url.replace('/api/index', '');
          req.url = rawPath.startsWith('/') ? `/api${rawPath}` : `/api/${rawPath}`;
        } else if (!req.url.startsWith('/api/') && req.url !== '/api') {
          req.url = '/api' + (req.url.startsWith('/') ? '' : '/') + req.url;
        }
      }

      res.on('finish', () => resolve(true));
      res.on('close', () => resolve(true));
      res.on('error', (err: any) => {
        console.error('[Vercel Response Error]', err);
        resolve(false);
      });

      app(req, res);
    } catch (err: any) {
      console.error('[Vercel Serverless Handler Error]', err);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: err.message || 'Internal Server Error'
        });
      }
      resolve(false);
    }
  });
}
