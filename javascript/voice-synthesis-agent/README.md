# Voice Synthesis Agent (JavaScript)

Convert text to natural-sounding speech using OpenAI TTS, ElevenLabs, Google TTS, or AWS Polly.

## Installation

```bash
npm install openai  # For OpenAI TTS
# OR
npm install elevenlabs  # For ElevenLabs
```

## Quick Start

```javascript
const VoiceSynthesisAgent = require('./VoiceSynthesisAgent');

const agent = new VoiceSynthesisAgent({
  provider: 'openai',
  apiKey: 'your-api-key',
  voice: 'nova'
});

await agent.use(async (agent) => {
  const audio = await agent.execute('Hello, world!', { outputFile: 'hello.mp3' });
  console.log(`Audio: ${audio}`);

  // Different voice and speed
  await agent.execute('Fast speech', { voice: 'onyx', speed: 1.5, outputFile: 'fast.mp3' });
});
```

See Python version README for full documentation.
