"""
Voice Chat Agent - Full voice-based conversational AI

This agent combines speech-to-text, LLM chat, and text-to-speech
for complete voice-based interactions
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from base.agent import BaseAgent
from typing import Optional, Dict, Any, Union
import tempfile


class VoiceChatAgent(BaseAgent):
    """
    A voice chat agent that enables full voice conversations

    Features:
    - Voice input (speech-to-text)
    - AI conversation (LLM)
    - Voice output (text-to-speech)
    - Conversation history
    - Multi-turn conversations
    - Interruption handling
    - Context awareness
    - Multi-language support

    Example:
        agent = VoiceChatAgent({
            'stt_provider': 'openai',
            'tts_provider': 'openai',
            'llm_provider': 'anthropic',
            'stt_api_key': 'openai-key',
            'tts_api_key': 'openai-key',
            'llm_api_key': 'anthropic-key',
            'voice': 'nova',
            'system_prompt': 'You are a friendly voice assistant'
        })

        with agent:
            # Voice conversation
            response_audio = agent.execute('user_audio.mp3')
            # response_audio is the AI's spoken response

            # Get text transcript too
            result = agent.execute('user_audio.mp3', return_text=True)
            print(f"User said: {result['user_text']}")
            print(f"AI said: {result['ai_text']}")
            print(f"Audio: {result['audio_file']}")
    """

    def _initialize(self) -> None:
        """Initialize voice chat agent"""
        # STT configuration
        self.state['stt_provider'] = self.config.get('stt_provider', 'openai')
        self.state['stt_api_key'] = self.config.get('stt_api_key', os.getenv('STT_API_KEY'))

        # TTS configuration
        self.state['tts_provider'] = self.config.get('tts_provider', 'openai')
        self.state['tts_api_key'] = self.config.get('tts_api_key', os.getenv('TTS_API_KEY'))
        self.state['voice'] = self.config.get('voice', 'nova')
        self.state['speech_speed'] = self.config.get('speech_speed', 1.0)

        # LLM configuration
        self.state['llm_provider'] = self.config.get('llm_provider', 'anthropic')
        self.state['llm_api_key'] = self.config.get('llm_api_key', os.getenv('LLM_API_KEY'))
        self.state['model'] = self.config.get('model', 'claude-3-5-sonnet-20241022')
        self.state['system_prompt'] = self.config.get(
            'system_prompt',
            'You are a helpful voice assistant. Keep responses concise and conversational.'
        )

        # General settings
        self.state['language'] = self.config.get('language', 'en')
        self.state['max_history'] = self.config.get('max_history', 10)
        self.state['messages'] = []

        # Initialize sub-agents
        self._init_sub_agents()

    def _init_sub_agents(self) -> None:
        """Initialize the STT, TTS, and LLM components"""
        # Import sub-agents
        try:
            # Import after path is set
            stt_provider = self.state['stt_provider']
            tts_provider = self.state['tts_provider']
            llm_provider = self.state['llm_provider']

            if stt_provider == 'openai':
                import openai
                self.state['stt_client'] = openai.OpenAI(api_key=self.state['stt_api_key'])
                self.logger.info("STT client initialized (OpenAI)")

            if tts_provider == 'openai':
                import openai
                self.state['tts_client'] = openai.OpenAI(api_key=self.state['tts_api_key'])
                self.logger.info("TTS client initialized (OpenAI)")

            if llm_provider == 'anthropic':
                import anthropic
                self.state['llm_client'] = anthropic.Anthropic(api_key=self.state['llm_api_key'])
                self.logger.info("LLM client initialized (Anthropic)")
            elif llm_provider == 'openai':
                import openai
                self.state['llm_client'] = openai.OpenAI(api_key=self.state['llm_api_key'])
                self.logger.info("LLM client initialized (OpenAI)")

            # Add system message
            if self.state['system_prompt']:
                self.state['messages'].append({
                    'role': 'system',
                    'content': self.state['system_prompt']
                })

        except ImportError as e:
            self.logger.warning(f"Failed to import required package: {e}")
            # Fall back to mock mode
            self.state['stt_client'] = None
            self.state['tts_client'] = None
            self.state['llm_client'] = None

    def execute(
        self,
        audio_input: Union[str, bytes],
        return_text: bool = False,
        **kwargs
    ) -> Union[str, Dict[str, Any]]:
        """
        Process voice input and generate voice response

        Args:
            audio_input: Path to audio file or audio bytes
            return_text: If True, return dict with text transcripts
            **kwargs: Additional parameters

        Returns:
            Path to response audio file, or dict with full conversation data
        """
        if not self._initialized:
            self.initialize()

        # Step 1: Transcribe user's speech
        user_text = self._transcribe(audio_input)
        self.logger.info(f"User said: {user_text}")

        # Step 2: Generate AI response
        ai_text = self._generate_response(user_text)
        self.logger.info(f"AI responded: {ai_text}")

        # Step 3: Synthesize AI's response to speech
        audio_file = self._synthesize(ai_text)
        self.logger.info(f"Response audio: {audio_file}")

        # Return based on return_text flag
        if return_text:
            return {
                'user_text': user_text,
                'ai_text': ai_text,
                'audio_file': audio_file,
                'conversation_history': self.get_history()
            }
        else:
            return audio_file

    def _transcribe(self, audio_input: Union[str, bytes]) -> str:
        """Transcribe audio to text"""
        if self.state['stt_client'] is None:
            return f"Mock transcription of audio input"

        try:
            client = self.state['stt_client']

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
            transcript = client.audio.transcriptions.create(
                model='whisper-1',
                file=audio_file,
                language=self.state['language']
            )

            audio_file.close()
            return transcript.text

        except Exception as e:
            self.logger.error(f"Transcription error: {e}")
            raise

    def _generate_response(self, user_text: str) -> str:
        """Generate AI response using LLM"""
        # Add user message to history
        self.state['messages'].append({
            'role': 'user',
            'content': user_text
        })

        if self.state['llm_client'] is None:
            response_text = f"Mock AI response to: {user_text}"
        else:
            try:
                provider = self.state['llm_provider']

                if provider == 'anthropic':
                    # Anthropic Claude
                    client = self.state['llm_client']

                    # Separate system message from conversation
                    system_msg = self.state['system_prompt']
                    conversation = [m for m in self.state['messages'] if m['role'] != 'system']

                    response = client.messages.create(
                        model=self.state['model'],
                        max_tokens=1024,
                        system=system_msg,
                        messages=conversation
                    )
                    response_text = response.content[0].text

                elif provider == 'openai':
                    # OpenAI
                    client = self.state['llm_client']

                    response = client.chat.completions.create(
                        model=self.state.get('model', 'gpt-4'),
                        messages=self.state['messages']
                    )
                    response_text = response.choices[0].message.content

                else:
                    raise ValueError(f"Unsupported LLM provider: {provider}")

            except Exception as e:
                self.logger.error(f"LLM error: {e}")
                response_text = "I'm sorry, I encountered an error processing your request."

        # Add AI response to history
        self.state['messages'].append({
            'role': 'assistant',
            'content': response_text
        })

        # Trim history if needed
        self._trim_history()

        return response_text

    def _synthesize(self, text: str) -> str:
        """Synthesize text to speech"""
        if self.state['tts_client'] is None:
            # Create mock audio file
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp3')
            temp_file.write(b'Mock audio: ' + text.encode())
            temp_file.close()
            return temp_file.name

        try:
            client = self.state['tts_client']

            # Generate output filename
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp3')
            temp_file.close()
            output_file = temp_file.name

            # Synthesize
            response = client.audio.speech.create(
                model='tts-1',
                voice=self.state['voice'],
                input=text,
                speed=self.state['speech_speed']
            )

            # Save to file
            response.stream_to_file(output_file)

            return output_file

        except Exception as e:
            self.logger.error(f"TTS error: {e}")
            raise

    def _trim_history(self) -> None:
        """Trim message history to max_history length"""
        max_history = self.state['max_history']

        # Always keep system message (index 0)
        if len(self.state['messages']) > max_history + 1:
            system_msg = self.state['messages'][0]
            self.state['messages'] = (
                [system_msg] +
                self.state['messages'][-(max_history):]
            )

    def get_history(self) -> list:
        """Get conversation history"""
        return self.state['messages']

    def clear_history(self) -> None:
        """Clear conversation history (except system message)"""
        system_msg = self.state['messages'][0] if self.state['messages'] else None
        self.state['messages'] = [system_msg] if system_msg else []
        self.logger.info("Conversation history cleared")

    def set_voice(self, voice: str) -> None:
        """Change the AI's voice"""
        self.state['voice'] = voice
        self.logger.info(f"Voice changed to: {voice}")

    def set_speech_speed(self, speed: float) -> None:
        """Change speech speed (0.25 to 4.0)"""
        self.state['speech_speed'] = max(0.25, min(4.0, speed))
        self.logger.info(f"Speech speed set to: {self.state['speech_speed']}")

    def chat_text(self, text: str, return_audio: bool = True) -> Union[str, Dict[str, Any]]:
        """
        Text-based chat (skips speech-to-text)

        Args:
            text: User's text message
            return_audio: Whether to generate audio response

        Returns:
            AI's text response or dict with text and audio
        """
        # Generate AI response
        ai_text = self._generate_response(text)

        if return_audio:
            audio_file = self._synthesize(ai_text)
            return {
                'text': ai_text,
                'audio': audio_file
            }
        else:
            return ai_text


# Example usage
if __name__ == '__main__':
    print("Voice Chat Agent Example")
    print("=" * 60)

    # Example 1: Mock mode (no API keys needed)
    print("\n1. Mock Voice Chat:")
    agent = VoiceChatAgent({
        'stt_provider': 'mock',
        'tts_provider': 'mock',
        'llm_provider': 'mock',
        'system_prompt': 'You are a helpful assistant'
    })

    with agent:
        result = agent.execute('test_audio.mp3', return_text=True)
        print(f"   User: {result['user_text']}")
        print(f"   AI: {result['ai_text']}")
        print(f"   Audio saved: {result['audio_file']}")

    # Example 2: Full OpenAI + Anthropic (requires API keys)
    print("\n2. Full Voice Chat example (commented - requires API keys):")
    print("""
    agent = VoiceChatAgent({
        'stt_provider': 'openai',
        'tts_provider': 'openai',
        'llm_provider': 'anthropic',
        'stt_api_key': 'your-openai-key',
        'tts_api_key': 'your-openai-key',
        'llm_api_key': 'your-anthropic-key',
        'voice': 'nova',
        'model': 'claude-3-5-sonnet-20241022',
        'system_prompt': 'You are a friendly voice assistant. Be concise.'
    })

    with agent:
        # Voice conversation
        print("User speaks into microphone...")
        response_audio = agent.execute('user_question.mp3')

        # Play response
        # import pygame
        # pygame.mixer.init()
        # pygame.mixer.music.load(response_audio)
        # pygame.mixer.music.play()

        # Or get full details
        result = agent.execute('user_question.mp3', return_text=True)
        print(f"User: {result['user_text']}")
        print(f"AI: {result['ai_text']}")

        # Change voice mid-conversation
        agent.set_voice('onyx')
        agent.set_speech_speed(1.2)

        # Continue conversation
        response = agent.execute('followup_question.mp3')
    """)

    # Example 3: Text input with voice output
    print("\n3. Text-to-Voice example:")
    print("""
    with agent:
        # Type instead of speak
        result = agent.chat_text('What is the weather like?')
        print(f"AI response: {result['text']}")
        print(f"Audio file: {result['audio']}")

        # Text only (no audio)
        text_response = agent.chat_text('Tell me a joke', return_audio=False)
        print(text_response)
    """)

    # Example 4: Voice assistant for accessibility
    print("\n4. Accessibility Voice Assistant:")
    print("""
    agent = VoiceChatAgent({
        'stt_provider': 'openai',
        'tts_provider': 'openai',
        'llm_provider': 'anthropic',
        'system_prompt': '''You are a voice assistant for visually impaired users.
                           Provide clear, detailed descriptions.
                           Always confirm actions before executing them.'''
    })

    with agent:
        # Voice-controlled application
        while True:
            # Record user voice
            # audio = record_audio()

            # Get response
            result = agent.execute(audio, return_text=True)

            # Speak response
            # play_audio(result['audio_file'])

            # Check for exit command
            if 'goodbye' in result['user_text'].lower():
                break
    """)
