# Voice Transcription Agent (JavaScript)

Convert speech to text using OpenAI Whisper, Google Speech-to-Text, or AssemblyAI.

## Installation

```bash
npm install openai  # For OpenAI Whisper
# OR
npm install @google-cloud/speech  # For Google
# OR
npm install assemblyai  # For AssemblyAI
```

## Quick Start

```javascript
const VoiceTranscriptionAgent = require('./VoiceTranscriptionAgent');

// Initialize
const agent = new VoiceTranscriptionAgent({
  provider: 'openai',
  apiKey: 'your-api-key',
  language: 'en'
});

// Transcribe
await agent.use(async (agent) => {
  const result = await agent.execute('audio.mp3');
  console.log(result.text);

  // With timestamps
  const withTime = await agent.execute('audio.mp3', { timestamps: true });
  for (const segment of withTime.segments) {
    console.log(`${segment.start}s: ${segment.text}`);
  }
});
```

See Python version README for full documentation.
