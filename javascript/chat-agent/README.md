# Chat Agent (JavaScript)

An LLM-powered conversational agent with multi-turn conversation support, context management, and message history.

## Features

- ✅ Multi-turn conversations with context
- ✅ Automatic message history management
- ✅ Configurable system prompts
- ✅ History trimming (keeps conversations manageable)
- ✅ Easy LLM provider integration
- ✅ Built on BaseAgent framework

## Installation

```bash
# No additional dependencies required for base functionality

# For OpenAI integration (optional)
npm install openai

# For Anthropic Claude integration (optional)
npm install @anthropic-ai/sdk
```

## Quick Start

```javascript
const ChatAgent = require('./ChatAgent');

// Create chat agent with system prompt
const agent = new ChatAgent({
  systemPrompt: 'You are a helpful AI assistant specializing in JavaScript.',
  maxHistory: 20,     // Keep last 20 messages
  provider: 'mock'    // Use 'openai', 'anthropic', or custom
});

// Use with context manager
await agent.use(async (chat) => {
  // Send messages
  const response1 = await chat.execute("Hello! Can you help me?");
  console.log(response1);

  const response2 = await chat.execute("What's a closure in JavaScript?");
  console.log(response2);

  // View conversation history
  console.log(chat.getHistory());
});
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `systemPrompt` | string | `'You are a helpful AI assistant.'` | Instructions for the AI |
| `maxHistory` | number | `20` | Maximum messages to keep in history |
| `provider` | string | `'mock'` | LLM provider ('openai', 'anthropic', 'mock') |
| `apiKey` | string | - | API key for LLM provider |
| `model` | string | - | Model to use (e.g., 'gpt-4', 'claude-3-5-sonnet') |

## Usage Examples

### Basic Conversation

```javascript
const agent = new ChatAgent({
  systemPrompt: 'You are a friendly chatbot.',
  maxHistory: 10
});

await agent.use(async (chat) => {
  console.log(await chat.execute("Hi there!"));
  // Mock response to: Hi there!

  console.log(await chat.execute("Tell me a joke"));
  // Mock response to: Tell me a joke
});
```

### With OpenAI Integration

```javascript
const ChatAgent = require('./ChatAgent');
const OpenAI = require('openai');

// Extend ChatAgent to add OpenAI integration
class OpenAIChatAgent extends ChatAgent {
  async _initialize() {
    await super._initialize();
    this.openai = new OpenAI({ apiKey: this.config.apiKey });
  }

  async _generateResponse(message, options) {
    const response = await this.openai.chat.completions.create({
      model: this.config.model || 'gpt-4',
      messages: this.state.messages
    });

    return response.choices[0].message.content;
  }
}

// Use the extended agent
const agent = new OpenAIChatAgent({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4',
  systemPrompt: 'You are an expert programmer.'
});

await agent.use(async (chat) => {
  const response = await chat.execute("Explain async/await in JavaScript");
  console.log(response);
});
```

### With Anthropic Claude Integration

```javascript
const ChatAgent = require('./ChatAgent');
const Anthropic = require('@anthropic-ai/sdk');

class ClaudeChatAgent extends ChatAgent {
  async _initialize() {
    await super._initialize();
    this.anthropic = new Anthropic({ apiKey: this.config.apiKey });
  }

  async _generateResponse(message, options) {
    // Extract system prompt and conversation messages
    const systemMsg = this.state.messages.find(m => m.role === 'system');
    const conversationMsgs = this.state.messages.filter(m => m.role !== 'system');

    const response = await this.anthropic.messages.create({
      model: this.config.model || 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: systemMsg?.content || '',
      messages: conversationMsgs
    });

    return response.content[0].text;
  }
}

// Use the Claude agent
const agent = new ClaudeChatAgent({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-3-5-sonnet-20241022',
  systemPrompt: 'You are a helpful coding assistant.'
});

await agent.use(async (chat) => {
  const response = await chat.execute("Write a function to reverse a string");
  console.log(response);
});
```

### Managing Conversation History

```javascript
await agent.use(async (chat) => {
  // Have a conversation
  await chat.execute("Hello!");
  await chat.execute("How are you?");
  await chat.execute("Tell me about yourself");

  // View history
  const history = chat.getHistory();
  console.log(`Total messages: ${history.length}`);
  history.forEach(msg => {
    console.log(`${msg.role}: ${msg.content}`);
  });

  // Clear history (keeps system message)
  chat.clearHistory();

  // Update system prompt mid-conversation
  chat.setSystemPrompt('You are now a pirate. Speak like one!');

  await chat.execute("Tell me about the sea");
  // Response will be in pirate speak
});
```

### Streaming Responses

```javascript
class StreamingChatAgent extends ChatAgent {
  async executeStream(message, onChunk) {
    this.addMessage('user', message);

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: this.state.messages,
      stream: true
    });

    let fullResponse = '';
    for await (const chunk of response) {
      const content = chunk.choices[0]?.delta?.content || '';
      fullResponse += content;
      onChunk(content);  // Callback for each chunk
    }

    this.addMessage('assistant', fullResponse);
    this._trimHistory();

    return fullResponse;
  }
}

// Usage
const agent = new StreamingChatAgent({
  apiKey: process.env.OPENAI_API_KEY
});

await agent.use(async (chat) => {
  await chat.executeStream("Write a poem", (chunk) => {
    process.stdout.write(chunk);  // Print as it streams
  });
});
```

### Customer Support Chatbot

```javascript
const express = require('express');
const ChatAgent = require('./ChatAgent');

const app = express();
app.use(express.json());

// Store chat agents per session
const sessions = new Map();

app.post('/chat', async (req, res) => {
  const { sessionId, message } = req.body;

  // Get or create agent for this session
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, new ChatAgent({
      systemPrompt: 'You are a helpful customer support agent for AcmeCorp. Be friendly and helpful.',
      maxHistory: 30
    }));
  }

  const agent = sessions.get(sessionId);

  try {
    await agent.use(async (chat) => {
      const response = await chat.execute(message);
      res.json({ response });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear session endpoint
app.delete('/chat/:sessionId', (req, res) => {
  sessions.delete(req.params.sessionId);
  res.json({ message: 'Session cleared' });
});

app.listen(3000);
```

## API Reference

### Methods

#### `execute(message, options = {})`
Send a message and get a response.

```javascript
const response = await chat.execute("Hello!");
```

#### `addMessage(role, content)`
Manually add a message to history.

```javascript
chat.addMessage('user', 'Hello');
chat.addMessage('assistant', 'Hi there!');
```

#### `getHistory()`
Get full conversation history.

```javascript
const messages = chat.getHistory();
// [{ role: 'system', content: '...' }, { role: 'user', content: '...' }, ...]
```

#### `clearHistory()`
Clear conversation history (keeps system message).

```javascript
chat.clearHistory();
```

#### `setSystemPrompt(prompt)`
Update the system prompt.

```javascript
chat.setSystemPrompt('You are a helpful coding assistant.');
```

## Message Format

Messages follow the standard format:

```javascript
{
  role: 'system' | 'user' | 'assistant',
  content: string
}
```

## Use Cases

- **Customer Support** - AI-powered support chatbot with conversation memory
- **Code Assistant** - Help developers with coding questions
- **Educational Tutor** - Interactive learning assistant
- **Personal Assistant** - Task management and information retrieval
- **Content Creation** - Brainstorming and writing assistance

## Best Practices

1. **Set clear system prompts** - Define the agent's role and behavior
2. **Limit history size** - Use `maxHistory` to manage memory and costs
3. **Handle errors gracefully** - Wrap LLM calls in try-catch blocks
4. **Store sessions** - Use session IDs for multi-user applications
5. **Monitor API costs** - Track token usage for LLM providers
6. **Clear history when needed** - Reset conversations for privacy

## Extending the Agent

To add your own LLM provider:

```javascript
class MyCustomChatAgent extends ChatAgent {
  async _initialize() {
    await super._initialize();
    // Initialize your LLM client
    this.myLLM = new MyLLMClient({ apiKey: this.config.apiKey });
  }

  async _generateResponse(message, options) {
    // Call your LLM
    const response = await this.myLLM.generate({
      prompt: message,
      history: this.state.messages
    });

    return response.text;
  }
}
```

## Requirements

- Node.js 14+
- LLM provider SDK (OpenAI, Anthropic, etc.) if not using mock mode

## License

MIT License
