const https = require('https');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { action, token, userData, accountId } = JSON.parse(event.body);

    let apiEndpoint, method, requestBody;

    switch (action) {
      case 'test_connection':
        // Test with the browser API URL but user creation endpoint format
        apiEndpoint = '/User/get_all_users?page=1&pagesize=10&sortfield=CreateDate&descending=false&deleted=false';
        method = 'GET';
        requestBody = null;
        break;
      
      case 'create_user_official':
        // Use the official documentation endpoint format
        apiEndpoint = '/User/insert_user';
        method = 'POST';
        
        // The userData already includes the accountId from the request
        requestBody = JSON.stringify(userData);
        break;
      
      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid action' })
        };
    }

    console.log(`Making ${method} request to: https://api.amove.io${apiEndpoint}`);
    console.log('Request data:', requestBody);

    // Use api.amove.io (your working URL) with official API format
    const response = await makeRequest(apiEndpoint, method, token, requestBody);
    
    console.log('Amove API Response:', response);
    
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
        error: error.message || 'Unknown error',
        details: error.toString()
      })
    };
  }
};

function makeRequest(endpoint, method, token, body) {
  return new Promise((resolve, reject) => {
    // Use api.amove.io (your working URL) but with official API format
    const options = {
      hostname: 'api.amove.io',
      path: endpoint,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    // Add token as query parameter (per official documentation)
    if (token) {
      const separator = endpoint.includes('?') ? '&' : '?';
      options.path += `${separator}token=${token}`;
    }

    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    console.log(`Request options:`, options);

    const req = https.request(options, (res) => {
      let data = '';
      
      console.log('Response status:', res.statusCode);
      console.log('Response headers:', res.headers);
      
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('Raw response data:', data);
        
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', (error) => {
      console.error('Request error:', error);
      reject(error);
    });
    
    if (body) {
      req.write(body);
    }
    
    req.end();
  });
}