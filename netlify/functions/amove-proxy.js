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

    let apiEndpoint, method, requestBody, useAuthHeader = false;

    switch (action) {
      case 'test_connection':
        // Use the browser API format that works
        apiEndpoint = '/api/user/get_all_users?page=1&pagesize=10&sortfield=CreateDate&descending=false&deleted=false';
        method = 'GET';
        requestBody = null;
        useAuthHeader = true; // Browser uses Authorization header
        break;
      
      case 'create_user_official':
        // Try BOTH API formats and see which one works
        apiEndpoint = '/api/user/insert_user'; // Browser format first
        method = 'POST';
        requestBody = JSON.stringify(userData);
        useAuthHeader = true; // Try Authorization header first
        break;
      
      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid action' })
        };
    }

    console.log(`🔍 DEBUG: Trying ${method} request to: https://api.amove.io${apiEndpoint}`);
    console.log('🔍 DEBUG: Auth method:', useAuthHeader ? 'Authorization header' : 'Query parameter');
    console.log('🔍 DEBUG: Request data:', requestBody);

    // Try the first format
    let response = await makeRequest(apiEndpoint, method, token, requestBody, useAuthHeader);
    
    console.log('🔍 DEBUG: First attempt response:', response);
    
    // If first attempt fails or returns empty, try alternative format
    if (action === 'create_user_official' && (!response || response === '' || (typeof response === 'object' && Object.keys(response).length === 0))) {
      console.log('🔍 DEBUG: First attempt failed/empty, trying documentation format...');
      
      // Try documentation format
      const altEndpoint = '/User/insert_user';
      console.log(`🔍 DEBUG: Trying alternative: https://api.amove.io${altEndpoint}`);
      
      const altResponse = await makeRequest(altEndpoint, method, token, requestBody, false); // Query param
      console.log('🔍 DEBUG: Alternative attempt response:', altResponse);
      
      if (altResponse && altResponse !== '') {
        response = altResponse;
        console.log('✅ DEBUG: Alternative format worked!');
      } else {
        console.log('❌ DEBUG: Alternative format also failed/empty');
      }
    }
    
    console.log('🔍 DEBUG: Final response being returned:', response);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, data: response })
    };

  } catch (error) {
    console.error('💥 DEBUG: Amove API Error:', error);
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

function makeRequest(endpoint, method, token, body, useAuthHeader = false) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.amove.io',
      path: endpoint,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    // Choose authentication method
    if (useAuthHeader && token) {
      console.log('🔍 DEBUG: Using Authorization header');
      options.headers['Authorization'] = `Bearer ${token}`;
      options.headers['X-App-Origin'] = 'WebApp';
    } else if (token) {
      console.log('🔍 DEBUG: Using query parameter');
      const separator = endpoint.includes('?') ? '&' : '?';
      options.path += `${separator}token=${token}`;
    }

    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    console.log(`🔍 DEBUG: Final request options:`, {
      hostname: options.hostname,
      path: options.path,
      method: options.method,
      headers: options.headers
    });

    const req = https.request(options, (res) => {
      let data = '';
      
      console.log('🔍 DEBUG: Response status:', res.statusCode);
      console.log('🔍 DEBUG: Response headers:', res.headers);
      
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('🔍 DEBUG: Raw response data:', data);
        console.log('🔍 DEBUG: Response length:', data.length);
        
        if (data.trim() === '') {
          console.log('⚠️ DEBUG: Empty response received');
          resolve('');
          return;
        }
        
        try {
          const parsed = JSON.parse(data);
          console.log('🔍 DEBUG: Parsed JSON response:', parsed);
          resolve(parsed);
        } catch (e) {
          console.log('🔍 DEBUG: Response is not JSON, returning as string');
          resolve(data);
        }
      });
    });

    req.on('error', (error) => {
      console.error('💥 DEBUG: Request error:', error);
      reject(error);
    });
    
    if (body) {
      console.log('🔍 DEBUG: Writing request body:', body);
      req.write(body);
    }
    
    req.end();
    console.log('🔍 DEBUG: Request sent');
  });
}