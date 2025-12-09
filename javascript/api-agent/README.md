# API Agent (JavaScript)

A RESTful API interaction handler with built-in retry logic, rate limiting, and authentication support.

## Features

- ✅ All HTTP methods (GET, POST, PUT, DELETE, PATCH)
- ✅ Automatic retry with exponential backoff
- ✅ Request/response logging
- ✅ Authentication handling (Bearer tokens, custom headers)
- ✅ Timeout configuration
- ✅ JSON auto-parsing
- ✅ Error handling and recovery

## Installation

```bash
# Install dependencies
npm install node-fetch  # Only needed for Node.js < 18
```

## Quick Start

```javascript
const ApiAgent = require('./ApiAgent');

// Create agent with base configuration
const agent = new ApiAgent({
  baseUrl: 'https://api.example.com',
  apiKey: 'your-api-key',  // Optional: adds Bearer token
  retryCount: 3,            // Retry failed requests 3 times
  retryDelay: 1000,         // Initial delay: 1 second
  timeout: 30000            // Request timeout: 30 seconds
});

// Use with context manager for automatic cleanup
await agent.use(async (api) => {
  // GET request
  const response = await api.get('/users/123');
  console.log(response.data);

  // POST request
  const newUser = await api.post('/users', {
    name: 'John Doe',
    email: 'john@example.com'
  });

  // PUT request
  await api.put('/users/123', { name: 'Jane Doe' });

  // DELETE request
  await api.delete('/users/123');
});
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `baseUrl` | string | `''` | Base URL for all requests |
| `apiKey` | string | - | API key (adds Bearer token to headers) |
| `headers` | object | `{}` | Default headers for all requests |
| `retryCount` | number | `3` | Number of retry attempts |
| `retryDelay` | number | `1000` | Initial retry delay in ms (exponential backoff) |
| `timeout` | number | `30000` | Request timeout in milliseconds |

## Usage Examples

### Basic GET Request

```javascript
const agent = new ApiAgent({
  baseUrl: 'https://api.github.com'
});

await agent.use(async (api) => {
  const response = await api.get('/users/octocat');
  console.log(response.data);
  // { login: 'octocat', id: 583231, ... }
});
```

### POST with Body

```javascript
await agent.use(async (api) => {
  const response = await api.post('/api/orders', {
    product_id: 123,
    quantity: 2,
    customer_email: 'customer@example.com'
  });

  console.log('Order created:', response.data);
});
```

### Authentication

```javascript
// Method 1: Pass API key in config
const agent = new ApiAgent({
  baseUrl: 'https://api.example.com',
  apiKey: 'your-api-key'
});

// Method 2: Set auth dynamically
await agent.use(async (api) => {
  api.setAuth('your-api-key', 'Bearer');  // Bearer token
  // or
  api.setAuth('your-api-key', 'Token');   // Custom auth type

  const data = await api.get('/protected-endpoint');
});
```

### Custom Headers

```javascript
await agent.use(async (api) => {
  // Set custom header
  api.setHeader('X-Custom-Header', 'value');
  api.setHeader('Accept-Language', 'en-US');

  const response = await api.get('/data');
});
```

### Request Logging

```javascript
await agent.use(async (api) => {
  await api.get('/users');
  await api.post('/users', { name: 'John' });
  await api.get('/posts');

  // View request log
  const log = api.getRequestLog();
  log.forEach(entry => {
    console.log(`${entry.timestamp}: ${entry.method} ${entry.url} - ${entry.status}`);
  });

  // Clear log
  api.clearRequestLog();
});
```

### Error Handling

```javascript
await agent.use(async (api) => {
  try {
    const response = await api.get('/non-existent-endpoint');
  } catch (error) {
    console.error('Request failed:', error.message);
    // "Request failed after 3 attempts: HTTP 404: Not Found"
  }
});
```

### All HTTP Methods

```javascript
await agent.use(async (api) => {
  // GET
  const users = await api.get('/users');

  // POST
  const newUser = await api.post('/users', { name: 'Alice' });

  // PUT (full update)
  await api.put('/users/123', { name: 'Alice Updated', email: 'alice@example.com' });

  // PATCH (partial update)
  await api.patch('/users/123', { name: 'Alice' });

  // DELETE
  await api.delete('/users/123');
});
```

## Advanced Features

### Retry Logic

Requests automatically retry on failure with exponential backoff:

- Attempt 1: Immediate
- Attempt 2: Wait 1 second
- Attempt 3: Wait 2 seconds
- Attempt 4: Wait 3 seconds

```javascript
const agent = new ApiAgent({
  baseUrl: 'https://api.example.com',
  retryCount: 5,      // Retry up to 5 times
  retryDelay: 500     // Start with 500ms delay
});
```

### Response Format

All methods return a response object:

```javascript
{
  status: 200,
  headers: {
    'content-type': 'application/json',
    'x-rate-limit': '100'
  },
  data: { /* response body */ }
}
```

### Request Log Format

```javascript
{
  timestamp: '2024-01-15T10:30:00.000Z',
  method: 'GET',
  url: 'https://api.example.com/users',
  status: 200,
  success: true
}
```

## Integration Examples

### Express.js API Client

```javascript
const express = require('express');
const ApiAgent = require('./ApiAgent');

const app = express();
const apiClient = new ApiAgent({
  baseUrl: process.env.API_BASE_URL,
  apiKey: process.env.API_KEY
});

app.get('/users/:id', async (req, res) => {
  try {
    await apiClient.use(async (api) => {
      const response = await api.get(`/users/${req.params.id}`);
      res.json(response.data);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000);
```

### Microservice Communication

```javascript
const ApiAgent = require('./ApiAgent');

class UserService {
  constructor() {
    this.api = new ApiAgent({
      baseUrl: 'http://user-service:8080',
      retryCount: 5
    });
  }

  async getUser(userId) {
    return await this.api.use(async (api) => {
      const response = await api.get(`/users/${userId}`);
      return response.data;
    });
  }

  async createUser(userData) {
    return await this.api.use(async (api) => {
      const response = await api.post('/users', userData);
      return response.data;
    });
  }
}

module.exports = UserService;
```

## Use Cases

- **API Integration** - Connect to third-party APIs (Stripe, SendGrid, etc.)
- **Microservices** - Service-to-service communication
- **Data Fetching** - Retrieve data from REST APIs
- **Webhook Delivery** - Send webhooks with retry logic
- **Backend for Frontend** - Proxy API requests from frontend

## Best Practices

1. **Use environment variables** for API keys and base URLs
2. **Enable request logging** in development for debugging
3. **Set appropriate timeouts** based on expected response time
4. **Configure retry counts** based on API reliability
5. **Handle errors gracefully** with try-catch blocks
6. **Clear request logs** periodically to avoid memory issues

## Requirements

- Node.js 14+
- `node-fetch` (if Node.js < 18)

## License

MIT License
