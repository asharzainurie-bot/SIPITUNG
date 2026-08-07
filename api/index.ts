import app from '../server';

export default function handler(req: any, res: any) {
  return new Promise((resolve) => {
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
      if (req.url) {
        let cleanUrl = req.url;

        // Strip /api/index.ts or /api/index or /api/index/ if present
        cleanUrl = cleanUrl.replace(/^\/api\/index(\.ts)?\/?/i, '/');

        // Ensure path starts with /api
        if (!cleanUrl.startsWith('/api/') && cleanUrl !== '/api') {
          cleanUrl = '/api' + (cleanUrl.startsWith('/') ? '' : '/') + cleanUrl;
        }

        // Handle case where query path parameter was provided
        if (req.query && req.query.path) {
          const pathStr = Array.isArray(req.query.path) ? req.query.path.join('/') : String(req.query.path);
          if (pathStr && !cleanUrl.includes(pathStr)) {
            const queryParams = new URLSearchParams();
            for (const [key, val] of Object.entries(req.query)) {
              if (key !== 'path' && val !== undefined) {
                if (Array.isArray(val)) {
                  val.forEach(v => queryParams.append(key, String(v)));
                } else {
                  queryParams.append(key, String(val));
                }
              }
            }
            const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
            cleanUrl = `/api/${pathStr.replace(/^\/+/, '')}${queryString}`;
          }
        }

        req.url = cleanUrl;
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
          error: 'Serverless execution error',
          message: err?.message || String(err)
        });
      }
      resolve(false);
    }
  });
}
