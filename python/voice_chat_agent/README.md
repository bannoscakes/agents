# Voice Chat Agent

Full voice-based conversational AI combining speech-to-text, LLM chat, and text-to-speech for natural voice interactions.

## Features

- Complete voice conversation pipeline (listen → think → speak)
- Speech-to-text transcription
- AI conversation with context
- Text-to-speech synthesis
- Conversation history management
- Multi-turn conversations
- Configurable voices and speech speed
- Text input with voice output option
- Multi-language support
- Provider flexibility (mix and match STT, TTS, LLM providers)

## Installation

```bash
# Install required packages
pip install openai anthropic

# Optional providers
pip install elevenlabs google-cloud-speech google-cloud-texttospeech
```

## Quick Start

### Basic Voice Conversation

```python
from voice_chat_agent import VoiceChatAgent

# Initialize
agent = VoiceChatAgent({
    'stt_provider': 'openai',        # Speech-to-text
    'tts_provider': 'openai',        # Text-to-speech
    'llm_provider': 'anthropic',     # LLM for conversation
    'stt_api_key': 'your-openai-key',
    'tts_api_key': 'your-openai-key',
    'llm_api_key': 'your-anthropic-key',
    'voice': 'nova',
    'system_prompt': 'You are a friendly voice assistant'
})

with agent:
    # User speaks (from audio file)
    response_audio = agent.execute('user_question.mp3')

    # Play the AI's response
    # (response_audio is the path to the generated audio file)
```

### Get Full Conversation Details

```python
with agent:
    result = agent.execute('user_audio.mp3', return_text=True)

    print(f"User said: {result['user_text']}")
    print(f"AI said: {result['ai_text']}")
    print(f"Response audio: {result['audio_file']}")
    print(f"History: {result['conversation_history']}")
```

### Text Input with Voice Output

```python
with agent:
    # Type instead of speak
    result = agent.chat_text('What is the weather today?')

    print(f"AI response: {result['text']}")
    # Play: result['audio']

    # Text only (no audio generation)
    text_response = agent.chat_text('Tell me a joke', return_audio=False)
    print(text_response)
```

## Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `stt_provider` | Speech-to-text provider ('openai', 'google', 'assemblyai') | 'openai' |
| `stt_api_key` | API key for STT provider | From env: STT_API_KEY |
| `tts_provider` | Text-to-speech provider ('openai', 'elevenlabs', 'google', 'aws') | 'openai' |
| `tts_api_key` | API key for TTS provider | From env: TTS_API_KEY |
| `llm_provider` | LLM provider ('anthropic', 'openai') | 'anthropic' |
| `llm_api_key` | API key for LLM provider | From env: LLM_API_KEY |
| `voice` | TTS voice ID | 'nova' |
| `speech_speed` | Speech speed (0.25-4.0) | 1.0 |
| `model` | LLM model name | 'claude-3-5-sonnet-20241022' |
| `system_prompt` | System prompt for the AI | Default assistant prompt |
| `language` | Language code | 'en' |
| `max_history` | Max conversation turns to keep | 10 |

## Use Cases

### 1. Voice Assistant

```python
agent = VoiceChatAgent({
    'stt_provider': 'openai',
    'tts_provider': 'openai',
    'llm_provider': 'anthropic',
    'system_prompt': 'You are a helpful voice assistant. Be concise and friendly.'
})

with agent:
    # Continuous voice conversation
    while True:
        # Record user audio (pseudo-code)
        # user_audio = record_from_microphone()

        # Process and respond
        result = agent.execute('user_audio.mp3', return_text=True)

        # Play AI response
        # play_audio(result['audio_file'])

        # Check for exit
        if 'goodbye' in result['user_text'].lower():
            agent.chat_text('Goodbye! Have a great day!')
            break
```

### 2. Accessibility Tool

```python
agent = VoiceChatAgent({
    'system_prompt': '''You are a voice assistant for visually impaired users.
                       Provide clear, detailed audio descriptions.
                       Always confirm actions before executing them.
                       Speak slowly and clearly.'''
})

with agent:
    agent.set_speech_speed(0.9)  # Slower for clarity

    # Voice-controlled navigation
    result = agent.execute('user_command.mp3', return_text=True)

    if 'read email' in result['user_text']:
        # Read emails aloud
        pass
    elif 'navigate to' in result['user_text']:
        # Navigate to location
        pass
```

### 3. Language Learning

```python
# Spanish tutor
agent = VoiceChatAgent({
    'language': 'es',
    'system_prompt': '''You are a Spanish language tutor.
                       Help users practice Spanish conversation.
                       Correct their mistakes gently.
                       Speak clearly in Spanish.'''
})

with agent:
    # Practice conversation
    response = agent.execute('student_spanish.mp3', return_text=True)

    print(f"Student: {response['user_text']}")
    print(f"Tutor: {response['ai_text']}")
```

### 4. Customer Service Bot

```python
agent = VoiceChatAgent({
    'system_prompt': '''You are a customer service representative.
                       Be polite, helpful, and professional.
                       Ask clarifying questions when needed.
                       Keep responses concise for voice.'''
})

with agent:
    # Handle customer inquiry
    result = agent.execute('customer_question.mp3', return_text=True)

    # Log conversation
    log_conversation(result['user_text'], result['ai_text'])

    # Generate response audio
    # send_to_customer(result['audio_file'])
```

### 5. Voice Diary / Journaling

```python
agent = VoiceChatAgent({
    'system_prompt': '''You are a journaling assistant.
                       Help users reflect on their day.
                       Ask thoughtful questions.
                       Be empathetic and supportive.'''
})

with agent:
    # Start journaling session
    agent.chat_text('Hello! How was your day today?')

    # User responds via voice
    entry = agent.execute('day_reflection.mp3', return_text=True)

    # Save to journal
    save_journal_entry(entry['user_text'], entry['ai_text'])
```

### 6. Multi-Language Support

```python
# Auto-detect language and respond appropriately
agent = VoiceChatAgent({
    'system_prompt': '''You are a multilingual assistant.
                       Detect the user's language and respond in that language.
                       Support English, Spanish, French, and German.'''
})

with agent:
    result = agent.execute('multilingual_audio.mp3', return_text=True)

    # Auto-detected language and response
    print(f"Detected: {result['user_text']}")
    print(f"Response: {result['ai_text']}")
```

## Advanced Features

### Change Voice Mid-Conversation

```python
with agent:
    agent.set_voice('nova')  # Female voice
    response1 = agent.chat_text('Hello!')

    agent.set_voice('onyx')  # Male voice
    response2 = agent.chat_text('Now with a different voice')
```

### Adjust Speech Speed

```python
with agent:
    agent.set_speech_speed(0.75)  # Slower (75%)
    slow_response = agent.chat_text('Speaking slowly')

    agent.set_speech_speed(1.5)   # Faster (150%)
    fast_response = agent.chat_text('Speaking quickly')
```

### Conversation History

```python
with agent:
    # Have some conversation
    agent.chat_text('What is Python?')
    agent.chat_text('Tell me more about its features')

    # Get full history
    history = agent.get_history()
    for msg in history:
        print(f"{msg['role']}: {msg['content']}")

    # Clear history
    agent.clear_history()
```

### Mix Providers

```python
# Best of each provider
agent = VoiceChatAgent({
    'stt_provider': 'openai',      # Whisper for transcription
    'llm_provider': 'anthropic',   # Claude for intelligence
    'tts_provider': 'elevenlabs'   # ElevenLabs for realistic voice
})
```

## Response Format

### Basic (Audio Only)
```python
audio_file = agent.execute('user.mp3')
# Returns: '/tmp/tts_1234.mp3'
```

### Full Details
```python
result = agent.execute('user.mp3', return_text=True)
# Returns:
{
    'user_text': 'What is the weather?',
    'ai_text': 'I don't have access to current weather data...',
    'audio_file': '/tmp/tts_1234.mp3',
    'conversation_history': [...]
}
```

## Error Handling

```python
try:
    result = agent.execute('audio.mp3', return_text=True)
except FileNotFoundError:
    print("Audio file not found")
except ValueError as e:
    print(f"Configuration error: {e}")
except Exception as e:
    print(f"Conversation failed: {e}")
    # Fallback to text mode
    text_result = agent.chat_text("Sorry, I didn't catch that", return_audio=False)
```

## Integration with Audio Playback

### Using pygame

```python
import pygame

pygame.mixer.init()

with agent:
    audio = agent.execute('user_input.mp3')

    # Play the response
    pygame.mixer.music.load(audio)
    pygame.mixer.music.play()

    # Wait for playback to finish
    while pygame.mixer.music.get_busy():
        pygame.time.Clock().tick(10)
```

### Using playsound

```python
from playsound import playsound

with agent:
    audio = agent.execute('user_input.mp3')
    playsound(audio)
```

## Performance Optimization

1. **Streaming**: For faster response, use streaming providers
2. **Caching**: Cache common responses
3. **Parallel Processing**: Transcribe while generating response
4. **Provider Selection**: Choose providers based on latency needs

## Cost Estimation

Typical costs per conversation turn (USD):

| Component | Provider | Cost per turn |
|-----------|----------|---------------|
| STT | OpenAI Whisper | $0.006/min (~$0.001) |
| LLM | Claude Sonnet | $0.003/1K tokens (~$0.01) |
| TTS | OpenAI TTS | $0.015/1K chars (~$0.003) |
| **Total** | | **~$0.014 per turn** |

For a 10-minute conversation (~20 turns): ~$0.28

## Environment Variables

```bash
# Set API keys
export STT_API_KEY="your-openai-key"
export TTS_API_KEY="your-openai-key"
export LLM_API_KEY="your-anthropic-key"

# Or use separate keys
export OPENAI_API_KEY="your-openai-key"
export ANTHROPIC_API_KEY="your-anthropic-key"
```

## License

MIT
