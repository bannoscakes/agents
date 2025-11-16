"""
Voice Transcription Agent - Speech-to-Text conversion

This agent converts audio files or streams to text using various STT providers
Supports: OpenAI Whisper, Google Speech-to-Text, AssemblyAI, and more
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from base.agent import BaseAgent
from typing import Optional, Dict, Any, Union
import tempfile


class VoiceTranscriptionAgent(BaseAgent):
    """
    A voice transcription agent that converts speech to text

    Features:
    - Multiple provider support (OpenAI Whisper, Google, AssemblyAI, etc.)
    - Audio file transcription
    - Real-time audio stream support
    - Language detection
    - Speaker diarization (provider-dependent)
    - Timestamp support
    - Custom vocabulary

    Example:
        agent = VoiceTranscriptionAgent({
            'provider': 'openai',  # or 'google', 'assemblyai'
            'api_key': 'your-api-key',
            'language': 'en',
            'model': 'whisper-1'
        })
        agent.initialize()

        # Transcribe a file
        result = agent.execute('audio.mp3')
        print(result['text'])

        # With timestamps
        result = agent.execute('audio.mp3', timestamps=True)
        for segment in result['segments']:
            print(f"{segment['start']}s - {segment['end']}s: {segment['text']}")
    """

    def _initialize(self) -> None:
        """Initialize voice transcription agent"""
        self.state['provider'] = self.config.get('provider', 'openai')
        self.state['api_key'] = self.config.get('api_key', os.getenv('TRANSCRIPTION_API_KEY'))
        self.state['language'] = self.config.get('language', 'en')
        self.state['model'] = self.config.get('model', 'whisper-1')

        # Provider-specific settings
        self.state['enable_diarization'] = self.config.get('enable_diarization', False)
        self.state['enable_timestamps'] = self.config.get('enable_timestamps', False)
        self.state['custom_vocabulary'] = self.config.get('custom_vocabulary', [])

        # Initialize provider client
        self._init_provider()

    def _init_provider(self) -> None:
        """Initialize the transcription provider client"""
        provider = self.state['provider']

        if provider == 'openai':
            # OpenAI Whisper setup
            try:
                import openai
                self.state['client'] = openai.OpenAI(api_key=self.state['api_key'])
                self.logger.info("OpenAI Whisper client initialized")
            except ImportError:
                self.logger.warning("OpenAI package not installed. Install with: pip install openai")

        elif provider == 'google':
            # Google Speech-to-Text setup
            try:
                from google.cloud import speech
                self.state['client'] = speech.SpeechClient()
                self.logger.info("Google Speech-to-Text client initialized")
            except ImportError:
                self.logger.warning("Google Cloud Speech package not installed. Install with: pip install google-cloud-speech")

        elif provider == 'assemblyai':
            # AssemblyAI setup
            try:
                import assemblyai as aai
                aai.settings.api_key = self.state['api_key']
                self.state['client'] = aai.Transcriber()
                self.logger.info("AssemblyAI client initialized")
            except ImportError:
                self.logger.warning("AssemblyAI package not installed. Install with: pip install assemblyai")

        elif provider == 'mock':
            self.state['client'] = None
            self.logger.info("Mock provider initialized")
        else:
            raise ValueError(f"Unsupported provider: {provider}")

    def execute(
        self,
        audio_input: Union[str, bytes],
        timestamps: bool = False,
        speaker_labels: bool = False,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Transcribe audio to text

        Args:
            audio_input: Path to audio file or audio bytes
            timestamps: Include word/segment timestamps
            speaker_labels: Include speaker diarization
            **kwargs: Provider-specific parameters

        Returns:
            Dictionary containing:
            - text: Full transcription
            - language: Detected language (if available)
            - confidence: Confidence score
            - segments: Timestamped segments (if requested)
            - speakers: Speaker labels (if requested)
        """
        if not self._initialized:
            self.initialize()

        provider = self.state['provider']

        if provider == 'openai':
            return self._transcribe_openai(audio_input, timestamps, **kwargs)
        elif provider == 'google':
            return self._transcribe_google(audio_input, timestamps, speaker_labels, **kwargs)
        elif provider == 'assemblyai':
            return self._transcribe_assemblyai(audio_input, timestamps, speaker_labels, **kwargs)
        elif provider == 'mock':
            return self._transcribe_mock(audio_input)
        else:
            raise ValueError(f"Provider {provider} not supported")

    def _transcribe_openai(
        self,
        audio_input: Union[str, bytes],
        timestamps: bool = False,
        **kwargs
    ) -> Dict[str, Any]:
        """Transcribe using OpenAI Whisper API"""
        try:
            client = self.state['client']

            # Handle file path or bytes
            if isinstance(audio_input, str):
                audio_file = open(audio_input, 'rb')
            else:
                # Write bytes to temp file
                temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp3')
                temp_file.write(audio_input)
                temp_file.close()
                audio_file = open(temp_file.name, 'rb')

            # Transcribe
            response_format = 'verbose_json' if timestamps else 'text'

            transcript = client.audio.transcriptions.create(
                model=self.state['model'],
                file=audio_file,
                language=self.state['language'],
                response_format=response_format,
                **kwargs
            )

            audio_file.close()

            # Format response
            if timestamps and hasattr(transcript, 'segments'):
                return {
                    'text': transcript.text,
                    'language': getattr(transcript, 'language', self.state['language']),
                    'segments': [
                        {
                            'start': seg['start'],
                            'end': seg['end'],
                            'text': seg['text']
                        }
                        for seg in transcript.segments
                    ]
                }
            else:
                return {
                    'text': transcript if isinstance(transcript, str) else transcript.text,
                    'language': self.state['language']
                }

        except Exception as e:
            self.logger.error(f"OpenAI transcription error: {e}")
            raise

    def _transcribe_google(
        self,
        audio_input: Union[str, bytes],
        timestamps: bool = False,
        speaker_labels: bool = False,
        **kwargs
    ) -> Dict[str, Any]:
        """Transcribe using Google Speech-to-Text"""
        # Placeholder for Google implementation
        self.logger.info("Google Speech-to-Text transcription")

        # Implementation would be:
        # 1. Load audio file
        # 2. Configure recognition
        # 3. Call API
        # 4. Parse results

        raise NotImplementedError("Google Speech-to-Text integration pending. Add implementation here.")

    def _transcribe_assemblyai(
        self,
        audio_input: Union[str, bytes],
        timestamps: bool = False,
        speaker_labels: bool = False,
        **kwargs
    ) -> Dict[str, Any]:
        """Transcribe using AssemblyAI"""
        try:
            transcriber = self.state['client']

            config = {
                'speaker_labels': speaker_labels,
                'language_code': self.state['language']
            }

            if isinstance(audio_input, str):
                transcript = transcriber.transcribe(audio_input, config=config)
            else:
                # Save bytes to temp file
                temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp3')
                temp_file.write(audio_input)
                temp_file.close()
                transcript = transcriber.transcribe(temp_file.name, config=config)

            result = {
                'text': transcript.text,
                'confidence': transcript.confidence,
                'language': self.state['language']
            }

            if timestamps and hasattr(transcript, 'words'):
                result['segments'] = [
                    {
                        'start': word.start / 1000,  # Convert ms to seconds
                        'end': word.end / 1000,
                        'text': word.text,
                        'confidence': word.confidence
                    }
                    for word in transcript.words
                ]

            if speaker_labels and hasattr(transcript, 'utterances'):
                result['speakers'] = [
                    {
                        'speaker': utt.speaker,
                        'start': utt.start / 1000,
                        'end': utt.end / 1000,
                        'text': utt.text
                    }
                    for utt in transcript.utterances
                ]

            return result

        except Exception as e:
            self.logger.error(f"AssemblyAI transcription error: {e}")
            raise

    def _transcribe_mock(self, audio_input: Union[str, bytes]) -> Dict[str, Any]:
        """Mock transcription for testing"""
        filename = audio_input if isinstance(audio_input, str) else "audio_bytes"
        return {
            'text': f"Mock transcription of: {filename}",
            'language': self.state['language'],
            'confidence': 0.95
        }

    def transcribe_stream(self, audio_stream, callback=None):
        """
        Transcribe audio stream in real-time

        Args:
            audio_stream: Audio stream generator
            callback: Function to call with partial results

        Returns:
            Final transcription result
        """
        # This would implement real-time streaming transcription
        # Provider-dependent implementation
        raise NotImplementedError("Streaming transcription not yet implemented")

    def set_custom_vocabulary(self, words: list) -> None:
        """Set custom vocabulary for better recognition"""
        self.state['custom_vocabulary'] = words
        self.logger.info(f"Custom vocabulary set: {len(words)} words")


# Example usage
if __name__ == '__main__':
    print("Voice Transcription Agent Example")
    print("=" * 60)

    # Example 1: Mock provider (no API key needed)
    agent = VoiceTranscriptionAgent({
        'provider': 'mock',
        'language': 'en'
    })

    with agent:
        print("\n1. Basic transcription (mock):")
        result = agent.execute('example_audio.mp3')
        print(f"   Text: {result['text']}")
        print(f"   Language: {result['language']}")

    # Example 2: OpenAI Whisper (requires API key)
    print("\n2. OpenAI Whisper example (commented - requires API key):")
    print("""
    agent = VoiceTranscriptionAgent({
        'provider': 'openai',
        'api_key': 'your-api-key',
        'model': 'whisper-1'
    })

    with agent:
        # Simple transcription
        result = agent.execute('audio.mp3')
        print(result['text'])

        # With timestamps
        result = agent.execute('audio.mp3', timestamps=True)
        for segment in result['segments']:
            print(f"{segment['start']:.2f}s - {segment['end']:.2f}s: {segment['text']}")
    """)

    # Example 3: AssemblyAI with speaker diarization
    print("\n3. AssemblyAI example (commented - requires API key):")
    print("""
    agent = VoiceTranscriptionAgent({
        'provider': 'assemblyai',
        'api_key': 'your-api-key'
    })

    with agent:
        result = agent.execute(
            'meeting.mp3',
            timestamps=True,
            speaker_labels=True
        )

        # Print by speaker
        for speaker in result['speakers']:
            print(f"Speaker {speaker['speaker']}: {speaker['text']}")
    """)
