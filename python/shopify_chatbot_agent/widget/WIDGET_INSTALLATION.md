# Shopify Chatbot Widget Installation Guide

This guide shows you how to embed the chatbot widget in your Shopify store.

## Method 1: Add to Shopify Theme (Recommended)

### Step 1: Access Theme Code

1. Log into your Shopify admin
2. Go to **Online Store** → **Themes**
3. Click **Actions** → **Edit code** on your active theme

### Step 2: Add Widget Code

1. In the left sidebar, find `Layout` → `theme.liquid`
2. Scroll to the bottom, just before the closing `</body>` tag
3. Paste the following code:

```liquid
<!-- Shopify Chatbot Widget -->
{% if template != 'cart' and template != 'checkout' %}
<div id="shopify-chatbot-widget">
  <button id="chat-button" aria-label="Open chat">
    <svg viewBox="0 0 24 24">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
    </svg>
  </button>

  <div id="chat-window">
    <div id="chat-header">
      <div>
        <h3>Chat with us</h3>
        <p>We're here to help!</p>
      </div>
      <button id="close-chat" aria-label="Close chat">&times;</button>
    </div>

    <div id="chat-messages">
      <div class="message bot">
        <div class="message-avatar">🤖</div>
        <div class="message-content">
          Hi! How can I help you today?
        </div>
      </div>
    </div>

    <div id="chat-input-area">
      <input
        type="text"
        id="chat-input"
        placeholder="Type your message..."
        autocomplete="off"
      />
      <button id="send-button" aria-label="Send message">
        <svg viewBox="0 0 24 24">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
        </svg>
      </button>
    </div>
  </div>
</div>
{% endif %}

<style>
/* Copy all CSS from chatbot-widget.html */
#shopify-chatbot-widget {
  position: fixed;
  bottom: 20px;
  right: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  z-index: 9999;
}
/* ... rest of CSS ... */
</style>

<script>
// Copy all JavaScript from chatbot-widget.html
(function() {
  const CONFIG = {
    apiUrl: '{{ shop.metafields.chatbot.api_url | default: "https://your-backend.com/chat" }}',
    storeName: '{{ shop.name }}',
  };
  // ... rest of JavaScript ...
})();
</script>
{% endif %}
```

4. Click **Save**

### Step 3: Configure API Endpoint

**Option A: Using Theme Settings**

1. Go to **Online Store** → **Themes** → **Customize**
2. Add a custom metafield:
   - Namespace: `chatbot`
   - Key: `api_url`
   - Value: `https://your-backend-url.com/chat`

**Option B: Direct Edit**

Replace this line in the JavaScript:
```javascript
apiUrl: 'https://your-backend.com/chat',
```

With your actual API endpoint.

## Method 2: Shopify App Embed

### Step 1: Create App Extension

```bash
shopify app generate extension
# Select: Theme app extension
```

### Step 2: Add Widget Code

In `blocks/chatbot.liquid`:

```liquid
{% schema %}
{
  "name": "Chatbot Widget",
  "target": "body",
  "settings": [
    {
      "type": "text",
      "id": "api_url",
      "label": "Chatbot API URL",
      "default": "https://your-backend.com/chat"
    }
  ]
}
{% endschema %}

<!-- Widget code here -->
```

### Step 3: Deploy

```bash
shopify app deploy
```

## Method 3: Custom Script (Fastest)

1. Go to **Online Store** → **Themes** → **Actions** → **Edit code**
2. Open `theme.liquid`
3. Before `</body>`, add:

```html
<script src="https://your-cdn.com/chatbot-widget.js"></script>
<script>
  ShopifyChatbot.init({
    apiUrl: 'https://your-backend.com/chat',
    storeName: '{{ shop.name }}'
  });
</script>
```

## Configuration Options

```javascript
const CONFIG = {
  // Required
  apiUrl: 'https://your-backend.com/chat',

  // Optional
  storeName: 'Your Store Name',
  apiKey: 'your-api-key',
  welcomeMessage: 'Hi! How can I help you today?',
  position: 'right',  // 'right' or 'left'
  primaryColor: '#667eea',
  buttonSize: 60,
  windowWidth: 380,
  windowHeight: 600
};
```

## Customization

### Change Colors

```css
#chat-button,
#send-button {
  background: #your-color !important;
}

#chat-header {
  background: linear-gradient(135deg, #your-color1 0%, #your-color2 100%);
}
```

### Change Position

```css
#shopify-chatbot-widget {
  bottom: 20px;
  left: 20px;  /* Instead of right */
}
```

### Change Welcome Message

```javascript
// In the JavaScript section, modify:
chatMessages.innerHTML = `
  <div class="message bot">
    <div class="message-avatar">🤖</div>
    <div class="message-content">
      Welcome to {{ shop.name }}! How can we assist you today?
    </div>
  </div>
`;
```

## Backend Setup

Your backend API should accept POST requests:

### Request Format

```json
{
  "message": "What's your return policy?",
  "conversationId": "conv_abc123",
  "customerEmail": "customer@example.com",
  "customerName": "John Doe"
}
```

### Response Format

```json
{
  "response": "Our return policy allows returns within 30 days..."
}
```

### Example Backend (Express.js)

```javascript
const express = require('express');
const ShopifyChatbotAgent = require('./ShopifyChatbotAgent');

const app = express();
app.use(express.json());

const agent = new ShopifyChatbotAgent({...});

app.post('/chat', async (req, res) => {
  const { message, customerEmail } = req.body;

  const response = await agent.execute(message, {
    customerEmail
  });

  res.json({ response });
});

app.listen(3000);
```

## Testing

1. Visit your store
2. Click the chat button (bottom right)
3. Type a message
4. Verify the response

### Test Messages

- "What's your return policy?"
- "Where is my order #12345?"
- "Do you ship internationally?"
- "I need to speak to a human"

## Troubleshooting

### Widget Not Showing

- Check that the code is before `</body>`
- Clear browser cache
- Check browser console for errors

### API Not Responding

- Verify API URL is correct
- Check CORS settings on backend
- Look at Network tab in browser DevTools

### Styling Issues

- Check for CSS conflicts with theme
- Add `!important` to critical styles
- Increase z-index if hidden

## Performance Optimization

### 1. Lazy Load Widget

```javascript
// Load widget only when user scrolls
window.addEventListener('scroll', function loadWidget() {
  // Load widget code here
  window.removeEventListener('scroll', loadWidget);
}, { once: true });
```

### 2. Cache Responses

```javascript
const cache = new Map();

async function sendMessage(message) {
  if (cache.has(message)) {
    return cache.get(message);
  }

  const response = await fetch(...);
  cache.set(message, response);
  return response;
}
```

## Security

1. **Use HTTPS** - Always use secure connections
2. **Rate Limiting** - Limit requests per user
3. **Input Validation** - Sanitize user input
4. **API Authentication** - Use API keys

```javascript
headers: {
  'Authorization': 'Bearer your-api-key',
  'Content-Type': 'application/json'
}
```

## Analytics

Track chatbot usage:

```javascript
// Track chat opens
chatButton.addEventListener('click', () => {
  if (window.gtag) {
    gtag('event', 'chat_opened');
  }
});

// Track messages sent
async function sendMessage() {
  // ... existing code ...

  if (window.gtag) {
    gtag('event', 'chat_message_sent');
  }
}
```

## Support

For issues or questions:
- Email: support@yourstore.com
- Documentation: See full README
- Examples: Check `/widget/examples/`
