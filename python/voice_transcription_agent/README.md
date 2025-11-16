# Voice Transcription Agent

Convert speech to text using various transcription providers (OpenAI Whisper, Google Speech-to-Text, AssemblyAI).

## Features

- Multiple provider support (OpenAI Whisper, Google, AssemblyAI, etc.)
- Audio file transcription (MP3, WAV, M4A, etc.)
- Real-time audio stream support
- Language detection and multi-language support
- Speaker diarization (who said what)
- Timestamp support (word/segment level)
- Custom vocabulary for domain-specific terms
- Confidence scores

## Installation

### Base Requirements
```bash
pip install openai  # For OpenAI Whisper
# OR
pip install google-cloud-speech  # For Google Speech-to-Text
# OR
pip install assemblyai  # For AssemblyAI
```

### Provider Setup

#### OpenAI Whisper
```bash
export TRANSCRIPTION_API_KEY="your-openai-api-key"
```

#### Google Speech-to-Text
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/credentials.json"
```

#### AssemblyAI
```bash
export TRANSCRIPTION_API_KEY="your-assemblyai-api-key"
```

## Quick Start

### Basic Transcription

```python
from voice_transcription_agent import VoiceTranscriptionAgent

# Initialize with OpenAI Whisper
agent = VoiceTranscriptionAgent({
    'provider': 'openai',
    'api_key': 'your-api-key',
    'language': 'en'
})

with agent:
    # Transcribe an audio file
    result = agent.execute('meeting_recording.mp3')
    print(result['text'])
```

### With Timestamps

```python
# Get word-level timestamps
result = agent.execute('audio.mp3', timestamps=True)

for segment in result['segments']:
    print(f"{segment['start']:.2f}s - {segment['end']:.2f}s: {segment['text']}")
```

### Speaker Diarization (AssemblyAI)

```python
agent = VoiceTranscriptionAgent({
    'provider': 'assemblyai',
    'api_key': 'your-api-key'
})

with agent:
    result = agent.execute(
        'meeting.mp3',
        speaker_labels=True
    )

    # Print by speaker
    for speaker_segment in result['speakers']:
        speaker = speaker_segment['speaker']
        text = speaker_segment['text']
        print(f"Speaker {speaker}: {text}")
```

### Custom Vocabulary

```python
agent = VoiceTranscriptionAgent({
    'provider': 'openai',
    'api_key': 'your-api-key'
})

with agent:
    # Set custom vocabulary for technical terms
    agent.set_custom_vocabulary([
        'Kubernetes',
        'PostgreSQL',
        'GraphQL',
        'WebSocket'
    ])

    result = agent.execute('tech_talk.mp3')
    print(result['text'])
```

## Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `provider` | Transcription provider: 'openai', 'google', 'assemblyai' | 'openai' |
| `api_key` | API key for the provider | From env var |
| `language` | Language code (e.g., 'en', 'es', 'fr') | 'en' |
| `model` | Model name (provider-specific) | 'whisper-1' |
| `enable_diarization` | Enable speaker detection | False |
| `enable_timestamps` | Include timestamps in results | False |
| `custom_vocabulary` | List of custom words/phrases | [] |

## Supported Audio Formats

- MP3
- WAV
- M4A
- FLAC
- OGG
- WebM

## Providers Comparison

| Provider | Accuracy | Speed | Cost | Speaker Diarization | Languages |
|----------|----------|-------|------|---------------------|-----------|
| OpenAI Whisper | Excellent | Fast | $0.006/min | No | 50+ |
| Google Speech | Excellent | Fast | $0.006/15s | Yes | 125+ |
| AssemblyAI | Excellent | Medium | $0.00025/s | Yes | English+ |

## Use Cases

### 1. Meeting Transcription
```python
agent = VoiceTranscriptionAgent({
    'provider': 'assemblyai',
    'api_key': 'your-key'
})

with agent:
    result = agent.execute(
        'team_meeting.mp3',
        speaker_labels=True,
        timestamps=True
    )

    # Generate meeting minutes
    for speaker_turn in result['speakers']:
        print(f"\n[{speaker_turn['start']:.0f}s] Speaker {speaker_turn['speaker']}:")
        print(f"  {speaker_turn['text']}")
```

### 2. Podcast Transcription
```python
agent = VoiceTranscriptionAgent({
    'provider': 'openai',
    'api_key': 'your-key'
})

with agent:
    result = agent.execute('podcast_episode.mp3', timestamps=True)

    # Create subtitles
    for segment in result['segments']:
        start = segment['start']
        end = segment['end']
        text = segment['text']
        print(f"{start:.2f} --> {end:.2f}")
        print(text)
        print()
```

### 3. Customer Service Call Analysis
```python
agent = VoiceTranscriptionAgent({
    'provider': 'assemblyai',
    'api_key': 'your-key'
})

agent.set_custom_vocabulary([
    'refund policy',
    'account number',
    'technical support'
])

with agent:
    result = agent.execute('customer_call.mp3', speaker_labels=True)

    # Analyze call
    print(f"Call transcript: {result['text']}")
    print(f"Confidence: {result['confidence']:.2%}")
```

## Response Format

### Basic Response
```json
{
  "text": "Hello, this is a transcription of the audio.",
  "language": "en",
  "confidence": 0.95
}
```

### With Timestamps
```json
{
  "text": "Hello, this is a transcription.",
  "language": "en",
  "segments": [
    {
      "start": 0.0,
      "end": 1.5,
      "text": "Hello,"
    },
    {
      "start": 1.5,
      "end": 3.2,
      "text": "this is a transcription."
    }
  ]
}
```

### With Speaker Labels
```json
{
  "text": "...",
  "speakers": [
    {
      "speaker": "A",
      "start": 0.0,
      "end": 5.2,
      "text": "Hello, how can I help you?"
    },
    {
      "speaker": "B",
      "start": 5.5,
      "end": 8.3,
      "text": "I have a question about my order."
    }
  ]
}
```

## Error Handling

```python
try:
    result = agent.execute('audio.mp3')
    print(result['text'])
except FileNotFoundError:
    print("Audio file not found")
except ValueError as e:
    print(f"Configuration error: {e}")
except Exception as e:
    print(f"Transcription failed: {e}")
```

## Performance Tips

1. **Use appropriate quality**: Higher quality audio = better transcription
2. **Reduce background noise**: Clean audio improves accuracy
3. **Choose the right provider**: Different providers excel at different tasks
4. **Batch processing**: Process multiple files efficiently
5. **Custom vocabulary**: Improves accuracy for domain-specific terms

## Integration Examples

See the main [examples/](../../examples/) directory for:
- Web application integration
- Real-time transcription
- Batch processing scripts
- Multi-language support

## License

MIT
