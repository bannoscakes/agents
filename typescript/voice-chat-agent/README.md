# Voice Chat Agent (TypeScript/Supabase)

Full voice-based conversational AI for TypeScript and Supabase Edge Functions.

## Installation

```bash
npm install openai @anthropic-ai/sdk
```

## Quick Start

```typescript
import { VoiceChatAgent } from './VoiceChatAgent';

const agent = new VoiceChatAgent({
  sttProvider: 'openai',
  ttsProvider: 'openai',
  llmProvider: 'anthropic',
  sttApiKey: process.env.OPENAI_API_KEY,
  ttsApiKey: process.env.OPENAI_API_KEY,
  llmApiKey: process.env.ANTHROPIC_API_KEY,
  voice: 'nova',
  systemPrompt: 'You are a friendly voice assistant'
});

// Voice conversation
const result = await agent.execute(audioFile);
console.log('User:', result.userText);
console.log('AI:', result.aiText);
// result.audioBuffer contains the AI's speech

// Text input with voice output
const response = await agent.chatText('What is the weather?');
console.log(response.text);
// response.audio contains the voice response
```

## Supabase Edge Function Example

```typescript
// supabase/functions/voice-chat/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { VoiceChatAgent } from './VoiceChatAgent.ts';

serve(async (req) => {
  const formData = await req.formData();
  const audioFile = formData.get('audio') as File;

  const agent = new VoiceChatAgent({
    sttApiKey: Deno.env.get('OPENAI_API_KEY'),
    ttsApiKey: Deno.env.get('OPENAI_API_KEY'),
    llmApiKey: Deno.env.get('ANTHROPIC_API_KEY')
  });

  const result = await agent.execute(audioFile);

  return new Response(result.audioBuffer, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'X-User-Text': result.userText,
      'X-AI-Text': result.aiText
    }
  });
});
```

See Python version README for full documentation and use cases.
