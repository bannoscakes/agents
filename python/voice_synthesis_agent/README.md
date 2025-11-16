# Voice Synthesis Agent

Convert text to natural-sounding speech using various TTS providers (OpenAI TTS, ElevenLabs, Google, AWS Polly).

## Features

- Multiple provider support (OpenAI TTS, ElevenLabs, Google, AWS Polly)
- Multiple voice options (male, female, different accents)
- Adjustable speech speed (0.25x to 4x)
- Multiple output formats (MP3, WAV, OGG)
- Streaming support for long texts
- SSML support for advanced control
- Multi-language support (50+ languages)
- High-quality, natural-sounding speech

## Installation

### Base Requirements
```bash
pip install openai  # For OpenAI TTS
# OR
pip install elevenlabs  # For ElevenLabs
# OR
pip install google-cloud-texttospeech  # For Google TTS
# OR
pip install boto3  # For AWS Polly
```

### Provider Setup

#### OpenAI TTS
```bash
export TTS_API_KEY="your-openai-api-key"
```

#### ElevenLabs
```bash
export TTS_API_KEY="your-elevenlabs-api-key"
```

#### Google Text-to-Speech
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/credentials.json"
```

#### AWS Polly
```bash
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_DEFAULT_REGION="us-east-1"
```

## Quick Start

### Basic Text-to-Speech

```python
from voice_synthesis_agent import VoiceSynthesisAgent

# Initialize with OpenAI TTS
agent = VoiceSynthesisAgent({
    'provider': 'openai',
    'api_key': 'your-api-key',
    'voice': 'alloy'
})

with agent:
    # Generate speech
    audio_file = agent.execute('Hello, world!', output_file='hello.mp3')
    print(f"Audio saved to: {audio_file}")
```

### Different Voices

```python
# OpenAI voices: alloy, echo, fable, onyx, nova, shimmer
audio = agent.execute('This is the Nova voice', voice='nova')
audio = agent.execute('This is the Onyx voice', voice='onyx')
```

### Speed Control

```python
# Faster speech (1.5x speed)
agent.execute('This is faster', speed=1.5, output_file='fast.mp3')

# Slower speech (0.75x speed)
agent.execute('This is slower', speed=0.75, output_file='slow.mp3')
```

### ElevenLabs (Ultra-Realistic)

```python
agent = VoiceSynthesisAgent({
    'provider': 'elevenlabs',
    'api_key': 'your-api-key',
    'voice': 'your-voice-id'
})

with agent:
    # Ultra-realistic speech
    audio = agent.execute(
        'This sounds incredibly realistic!',
        output_file='realistic.mp3'
    )
```

## Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `provider` | TTS provider: 'openai', 'elevenlabs', 'google', 'aws' | 'openai' |
| `api_key` | API key for the provider | From env var |
| `voice` | Voice ID/name (provider-specific) | 'alloy' |
| `model` | Model name (provider-specific) | 'tts-1' |
| `language` | Language code (e.g., 'en', 'es', 'fr') | 'en' |
| `speed` | Speech speed (0.25 to 4.0) | 1.0 |
| `output_format` | Audio format: 'mp3', 'wav', 'ogg' | 'mp3' |

## Supported Voices

### OpenAI TTS
- **alloy** - Neutral, balanced voice
- **echo** - Male voice
- **fable** - British English accent
- **onyx** - Deep male voice
- **nova** - Female voice
- **shimmer** - Soft female voice

### ElevenLabs
- Custom cloned voices
- Professional voice library
- Ultra-realistic quality

### Google TTS
- 100+ voices across 40+ languages
- WaveNet and Standard quality tiers
- Multiple accents per language

### AWS Polly
- **Joanna** - Female US English
- **Matthew** - Male US English
- **Salli** - Female US English
- **Joey** - Male US English
- **Ivy** - Female child US English
- And 50+ more voices

## Providers Comparison

| Provider | Quality | Cost | Voices | Languages | Latency |
|----------|---------|------|--------|-----------|---------|
| OpenAI TTS | Excellent | $15/1M chars | 6 | 50+ | Fast |
| ElevenLabs | Best | $0.30/1K chars | Custom | English+ | Medium |
| Google TTS | Excellent | $4/1M chars | 100+ | 40+ | Fast |
| AWS Polly | Good | $4/1M chars | 60+ | 30+ | Fast |

## Use Cases

### 1. Podcast Generation
```python
agent = VoiceSynthesisAgent({
    'provider': 'openai',
    'api_key': 'your-key',
    'voice': 'nova'
})

with agent:
    script = """
    Welcome to today's episode of Tech Talk.
    Today we'll discuss the latest in AI technology.
    """

    audio = agent.execute(script, output_file='podcast_intro.mp3')
```

### 2. Audiobook Creation
```python
agent = VoiceSynthesisAgent({
    'provider': 'elevenlabs',
    'api_key': 'your-key',
    'voice': 'your-narrator-voice'
})

with agent:
    # Read long text from file
    with open('chapter1.txt') as f:
        chapter_text = f.read()

    audio = agent.synthesize_long_text(
        chapter_text,
        output_file='chapter1.mp3'
    )
```

### 3. Voice Notifications
```python
agent = VoiceSynthesisAgent({
    'provider': 'openai',
    'voice': 'onyx'
})

with agent:
    # Quick notification
    agent.execute(
        'Your build has completed successfully',
        output_file='notification.mp3'
    )

    # Play audio (using playsound library)
    # from playsound import playsound
    # playsound('notification.mp3')
```

### 4. Multi-Language Content
```python
# Spanish
agent = VoiceSynthesisAgent({
    'provider': 'google',
    'language': 'es',
    'voice': 'es-ES-Standard-A'
})

with agent:
    audio = agent.execute('Hola, ¿cómo estás?', output_file='spanish.mp3')

# French
agent.state['language'] = 'fr'
agent.state['voice'] = 'fr-FR-Standard-A'
audio = agent.execute('Bonjour, comment allez-vous?', output_file='french.mp3')
```

### 5. Voice Cloning (ElevenLabs)
```python
agent = VoiceSynthesisAgent({
    'provider': 'elevenlabs',
    'api_key': 'your-key',
    'voice': 'your-cloned-voice-id'
})

with agent:
    # Use your cloned voice
    audio = agent.execute(
        'This is my cloned voice speaking!',
        output_file='cloned.mp3'
    )
```

## Advanced Features

### List Available Voices

```python
voices = agent.get_available_voices()
print(f"Available voices: {voices}")
```

### Long Text Synthesis

```python
# Automatically splits long text into chunks
long_text = "..." # Your long article or book chapter

audio = agent.synthesize_long_text(
    long_text,
    output_file='long_audio.mp3',
    chunk_size=4000  # Characters per chunk
)
```

### Custom Voice Parameters

```python
# OpenAI with custom parameters
audio = agent.execute(
    'Custom speech parameters',
    voice='alloy',
    speed=1.2,
    response_format='mp3',  # or 'opus', 'aac', 'flac'
    output_file='custom.mp3'
)
```

## Integration with Other Agents

### Voice Chat System

```python
from voice_transcription_agent import VoiceTranscriptionAgent
from voice_synthesis_agent import VoiceSynthesisAgent
from chat_agent import ChatAgent

# Create voice chat system
transcription = VoiceTranscriptionAgent({'provider': 'openai'})
chat = ChatAgent({'system_prompt': 'You are a helpful assistant'})
synthesis = VoiceSynthesisAgent({'provider': 'openai', 'voice': 'nova'})

with transcription, chat, synthesis:
    # User speaks
    user_text = transcription.execute('user_audio.mp3')['text']

    # AI responds
    response_text = chat.execute(user_text)

    # AI speaks
    synthesis.execute(response_text, output_file='response.mp3')
```

## Error Handling

```python
try:
    audio = agent.execute('Hello', output_file='output.mp3')
except ValueError as e:
    print(f"Configuration error: {e}")
except Exception as e:
    print(f"Synthesis failed: {e}")
```

## Performance Tips

1. **Use appropriate model**: `tts-1` for speed, `tts-1-hd` for quality
2. **Batch processing**: Generate multiple files in one session
3. **Cache common phrases**: Save frequently used audio
4. **Choose the right provider**: Different providers excel at different tasks
5. **Optimize chunk size**: For long texts, find optimal chunk size

## Output Formats

Supported formats (provider-dependent):
- **MP3** - Universal, good compression
- **WAV** - Uncompressed, highest quality
- **OGG** - Good compression, open format
- **AAC** - Better than MP3 compression
- **FLAC** - Lossless compression

## License

MIT
