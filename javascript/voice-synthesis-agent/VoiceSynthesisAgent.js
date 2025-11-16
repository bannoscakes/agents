/**
 * Voice Synthesis Agent - Text-to-Speech conversion
 *
 * Supports: OpenAI TTS, ElevenLabs, Google TTS, AWS Polly
 */

const BaseAgent = require('../base/Agent');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class VoiceSynthesisAgent extends BaseAgent {
  /**
   * Initialize voice synthesis agent
   */
  async _initialize() {
    this.state.provider = this.config.provider || 'openai';
    this.state.apiKey = this.config.apiKey || process.env.TTS_API_KEY;
    this.state.voice = this.config.voice || 'alloy';
    this.state.model = this.config.model || 'tts-1';
    this.state.language = this.config.language || 'en';
    this.state.speed = this.config.speed || 1.0;
    this.state.outputFormat = this.config.outputFormat || 'mp3';

    // Initialize provider client
    await this._initProvider();
  }

  /**
   * Initialize the TTS provider client
   * @private
   */
  async _initProvider() {
    const provider = this.state.provider;

    if (provider === 'openai') {
      try {
        const OpenAI = require('openai');
        this.state.client = new OpenAI({ apiKey: this.state.apiKey });
        this.log('info', 'OpenAI TTS client initialized');
      } catch (error) {
        this.log('warn', 'OpenAI package not installed. Install with: npm install openai');
      }
    } else if (provider === 'elevenlabs') {
      try {
        const { ElevenLabsClient } = require('elevenlabs');
        this.state.client = new ElevenLabsClient({ apiKey: this.state.apiKey });
        this.log('info', 'ElevenLabs client initialized');
      } catch (error) {
        this.log('warn', 'ElevenLabs package not installed. Install with: npm install elevenlabs');
      }
    } else if (provider === 'google') {
      try {
        const textToSpeech = require('@google-cloud/text-to-speech');
        this.state.client = new textToSpeech.TextToSpeechClient();
        this.log('info', 'Google TTS client initialized');
      } catch (error) {
        this.log('warn', 'Google Cloud TTS package not installed');
      }
    } else if (provider === 'aws') {
      try {
        const AWS = require('aws-sdk');
        this.state.client = new AWS.Polly();
        this.log('info', 'AWS Polly client initialized');
      } catch (error) {
        this.log('warn', 'AWS SDK not installed. Install with: npm install aws-sdk');
      }
    } else if (provider === 'mock') {
      this.state.client = null;
      this.log('info', 'Mock provider initialized');
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * Convert text to speech
   * @param {string} text - Text to convert
   * @param {Object} options - Synthesis options
   * @param {string} options.outputFile - Path to save audio
   * @param {string} options.voice - Voice ID
   * @param {number} options.speed - Speech speed (0.25-4.0)
   * @returns {Promise<string>} Path to generated audio file
   */
  async execute(text, options = {}) {
    if (!this._initialized) {
      await this.initialize();
    }

    const voice = options.voice || this.state.voice;
    const speed = options.speed || this.state.speed;

    // Generate output filename if not provided
    let outputFile = options.outputFile;
    if (!outputFile) {
      const hash = Math.abs(this._hashCode(text)) % 10000;
      outputFile = path.join(os.tmpdir(), `tts_${hash}.${this.state.outputFormat}`);
    }

    const provider = this.state.provider;

    if (provider === 'openai') {
      return await this._synthesizeOpenAI(text, outputFile, voice, speed, options);
    } else if (provider === 'elevenlabs') {
      return await this._synthesizeElevenLabs(text, outputFile, voice, options);
    } else if (provider === 'google') {
      return await this._synthesizeGoogle(text, outputFile, voice, speed, options);
    } else if (provider === 'aws') {
      return await this._synthesizeAWS(text, outputFile, voice, speed, options);
    } else if (provider === 'mock') {
      return await this._synthesizeMock(text, outputFile);
    } else {
      throw new Error(`Provider ${provider} not supported`);
    }
  }

  /**
   * Synthesize using OpenAI TTS
   * @private
   */
  async _synthesizeOpenAI(text, outputFile, voice, speed, options) {
    try {
      const client = this.state.client;

      const response = await client.audio.speech.create({
        model: this.state.model,
        voice: voice,
        input: text,
        speed: speed,
        ...options
      });

      // Get audio buffer
      const buffer = Buffer.from(await response.arrayBuffer());

      // Write to file
      await fs.writeFile(outputFile, buffer);

      this.log('info', `Speech generated: ${outputFile}`);
      return outputFile;
    } catch (error) {
      this.log('error', `OpenAI TTS error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Synthesize using ElevenLabs
   * @private
   */
  async _synthesizeElevenLabs(text, outputFile, voice, options) {
    try {
      const client = this.state.client;

      const audio = await client.generate({
        text: text,
        voice: voice,
        model_id: options.model || 'eleven_monolingual_v1'
      });

      // Write audio chunks to file
      const chunks = [];
      for await (const chunk of audio) {
        chunks.push(chunk);
      }
      await fs.writeFile(outputFile, Buffer.concat(chunks));

      this.log('info', `Speech generated: ${outputFile}`);
      return outputFile;
    } catch (error) {
      this.log('error', `ElevenLabs TTS error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Synthesize using Google TTS
   * @private
   */
  async _synthesizeGoogle(text, outputFile, voice, speed, options) {
    throw new Error('Google TTS integration pending');
  }

  /**
   * Synthesize using AWS Polly
   * @private
   */
  async _synthesizeAWS(text, outputFile, voice, speed, options) {
    throw new Error('AWS Polly integration pending');
  }

  /**
   * Mock synthesis for testing
   * @private
   */
  async _synthesizeMock(text, outputFile) {
    const mockData = Buffer.from(`Mock audio data for: ${text}`);
    await fs.writeFile(outputFile, mockData);
    this.log('info', `Mock speech generated: ${outputFile}`);
    return outputFile;
  }

  /**
   * Get available voices for current provider
   * @returns {Promise<Array>} List of available voices
   */
  async getAvailableVoices() {
    const provider = this.state.provider;

    if (provider === 'openai') {
      return ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
    } else if (provider === 'elevenlabs') {
      try {
        const voices = await this.state.client.voices.getAll();
        return voices.voices.map(v => ({ id: v.voice_id, name: v.name }));
      } catch {
        return [];
      }
    } else {
      return [];
    }
  }

  /**
   * Simple hash function for strings
   * @private
   */
  _hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }
}

module.exports = VoiceSynthesisAgent;

// Example usage
if (require.main === module) {
  (async () => {
    console.log('Voice Synthesis Agent Example');
    console.log('='.repeat(60));

    // Mock provider example
    const agent = new VoiceSynthesisAgent({
      provider: 'mock',
      voice: 'alloy'
    });

    await agent.use(async (agent) => {
      console.log('\n1. Basic synthesis (mock):');
      const output = await agent.execute('Hello, world!', { outputFile: 'test_output.mp3' });
      console.log(`   Audio saved to: ${output}`);

      console.log('\n2. Available voices:');
      const voices = await agent.getAvailableVoices();
      console.log(`   Voices: ${JSON.stringify(voices)}`);
    });

    // OpenAI TTS example (commented)
    console.log('\n3. OpenAI TTS example (commented - requires API key):');
    console.log(`
    const agent = new VoiceSynthesisAgent({
      provider: 'openai',
      apiKey: 'your-api-key',
      voice: 'alloy',
      model: 'tts-1'
    });

    await agent.use(async (agent) => {
      // Generate speech
      const audio = await agent.execute('Hello, world!', { outputFile: 'hello.mp3' });

      // With different voice and speed
      const audio2 = await agent.execute(
        'This is faster with a different voice',
        { voice: 'nova', speed: 1.5, outputFile: 'fast.mp3' }
      );
    });
    `);
  })();
}
