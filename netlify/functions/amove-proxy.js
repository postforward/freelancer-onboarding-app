const https = require('https');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { action, token, userData } = JSON.parse(event.body);

    let apiEndpoint, method, requestBody;

    switch (action) {
      case 'test_connection':
        apiEndpoint = '/api/user/get_all_users?page=1&pagesize=20&sortfield=CreateDate&descending=false&deleted=false';
        method = 'GET';
        requestBody = null;
        break;
      
      case 'create_user':
        apiEndpoint = '/api/user/create_user';
        method = 'POST';
        requestBody = JSON.stringify(userData);
        break;
      
      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid action' })
        };
    }

    // Make request to Amove API
    const response = await makeRequest(apiEndpoint, method, token, requestBody);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, data: response })
    };

  } catch (error) {
    console.error('Amove API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error' 
      })
    };
  }
};

function makeRequest(endpoint, method, token, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.amove.io',
      path: endpoint,
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-App-Origin': 'WebApp',
      }
    };

    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(body);
    }
    
    req.end();
  });
}