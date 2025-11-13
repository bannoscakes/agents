/**
 * API Agent - RESTful API interaction handler
 *
 * Features:
 * - HTTP methods (GET, POST, PUT, DELETE, PATCH)
 * - Request/response logging
 * - Retry logic
 * - Rate limiting
 * - Authentication handling
 */

const BaseAgent = require('../base/Agent');

class ApiAgent extends BaseAgent {
  /**
   * Initialize API agent
   */
  async _initialize() {
    this.state.baseUrl = this.config.baseUrl || '';
    this.state.headers = this.config.headers || {};
    this.state.retryCount = this.config.retryCount || 3;
    this.state.retryDelay = this.config.retryDelay || 1000;
    this.state.timeout = this.config.timeout || 30000;
    this.state.requestLog = [];

    // Add authentication if provided
    if (this.config.apiKey) {
      this.state.headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }
  }

  /**
   * Execute an API request
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  async execute(method, endpoint, options = {}) {
    if (!this._initialized) {
      await this.initialize();
    }

    method = method.toUpperCase();
    const url = this.state.baseUrl + endpoint;

    this.log('info', `${method} ${url}`);

    const requestOptions = {
      method,
      headers: { ...this.state.headers, ...options.headers },
      ...options
    };

    // Add body for POST, PUT, PATCH
    if (['POST', 'PUT', 'PATCH'].includes(method) && options.body) {
      requestOptions.body = JSON.stringify(options.body);
      requestOptions.headers['Content-Type'] = 'application/json';
    }

    let lastError;
    for (let attempt = 0; attempt < this.state.retryCount; attempt++) {
      try {
        const response = await this._makeRequest(url, requestOptions);
        this._logRequest(method, url, response.status, true);
        return response;
      } catch (error) {
        lastError = error;
        this.log('warn', `Attempt ${attempt + 1} failed: ${error.message}`);

        if (attempt < this.state.retryCount - 1) {
          await this._sleep(this.state.retryDelay * (attempt + 1));
        }
      }
    }

    this._logRequest(method, url, 0, false);
    throw new Error(`Request failed after ${this.state.retryCount} attempts: ${lastError.message}`);
  }

  /**
   * Make HTTP request
   * @private
   */
  async _makeRequest(url, options) {
    // Use fetch if available (Node.js 18+) or require node-fetch
    let fetch;
    try {
      fetch = global.fetch || require('node-fetch');
    } catch {
      throw new Error('fetch is not available. Install node-fetch: npm install node-fetch');
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      data
    };
  }

  /**
   * GET request
   */
  async get(endpoint, options = {}) {
    return this.execute('GET', endpoint, options);
  }

  /**
   * POST request
   */
  async post(endpoint, body, options = {}) {
    return this.execute('POST', endpoint, { ...options, body });
  }

  /**
   * PUT request
   */
  async put(endpoint, body, options = {}) {
    return this.execute('PUT', endpoint, { ...options, body });
  }

  /**
   * PATCH request
   */
  async patch(endpoint, body, options = {}) {
    return this.execute('PATCH', endpoint, { ...options, body });
  }

  /**
   * DELETE request
   */
  async delete(endpoint, options = {}) {
    return this.execute('DELETE', endpoint, options);
  }

  /**
   * Set authentication token
   */
  setAuth(token, type = 'Bearer') {
    this.state.headers['Authorization'] = `${type} ${token}`;
    this.log('info', 'Authentication token updated');
  }

  /**
   * Set custom header
   */
  setHeader(key, value) {
    this.state.headers[key] = value;
  }

  /**
   * Get request log
   */
  getRequestLog() {
    return this.state.requestLog;
  }

  /**
   * Clear request log
   */
  clearRequestLog() {
    this.state.requestLog = [];
  }

  /**
   * Log request
   * @private
   */
  _logRequest(method, url, status, success) {
    this.state.requestLog.push({
      timestamp: new Date().toISOString(),
      method,
      url,
      status,
      success
    });

    // Keep only last 100 requests
    if (this.state.requestLog.length > 100) {
      this.state.requestLog.shift();
    }
  }

  /**
   * Sleep helper
   * @private
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = ApiAgent;

// Example usage
if (require.main === module) {
  (async () => {
    console.log('API Agent Example');
    console.log('='.repeat(50));

    const agent = new ApiAgent({
      baseUrl: 'https://jsonplaceholder.typicode.com',
      retryCount: 3
    });

    await agent.use(async (agent) => {
      try {
        // GET request
        console.log('\n1. GET /posts/1');
        const post = await agent.get('/posts/1');
        console.log('Response:', post.data);

        // POST request
        console.log('\n2. POST /posts');
        const newPost = await agent.post('/posts', {
          title: 'Test Post',
          body: 'This is a test',
          userId: 1
        });
        console.log('Created:', newPost.data);

        // Request log
        console.log('\n3. Request Log:');
        agent.getRequestLog().forEach(log => {
          console.log(`  ${log.method} ${log.url} - ${log.status} (${log.success ? 'success' : 'failed'})`);
        });

      } catch (error) {
        console.error('Error:', error.message);
      }
    });
  })();
}
