/**
 * Voice Transcription Agent - Speech-to-Text conversion
 *
 * Supports: OpenAI Whisper, Google Speech-to-Text, AssemblyAI
 */

const BaseAgent = require('../base/Agent');
const fs = require('fs').promises;
const path = require('path');

class VoiceTranscriptionAgent extends BaseAgent {
  /**
   * Initialize voice transcription agent
   */
  async _initialize() {
    this.state.provider = this.config.provider || 'openai';
    this.state.apiKey = this.config.apiKey || process.env.TRANSCRIPTION_API_KEY;
    this.state.language = this.config.language || 'en';
    this.state.model = this.config.model || 'whisper-1';

    // Provider-specific settings
    this.state.enableDiarization = this.config.enableDiarization || false;
    this.state.enableTimestamps = this.config.enableTimestamps || false;
    this.state.customVocabulary = this.config.customVocabulary || [];

    // Initialize provider client
    await this._initProvider();
  }

  /**
   * Initialize the transcription provider client
   * @private
   */
  async _initProvider() {
    const provider = this.state.provider;

    if (provider === 'openai') {
      // OpenAI Whisper setup
      try {
        const OpenAI = require('openai');
        this.state.client = new OpenAI({ apiKey: this.state.apiKey });
        this.log('info', 'OpenAI Whisper client initialized');
      } catch (error) {
        this.log('warn', 'OpenAI package not installed. Install with: npm install openai');
      }
    } else if (provider === 'google') {
      // Google Speech-to-Text setup
      try {
        const speech = require('@google-cloud/speech');
        this.state.client = new speech.SpeechClient();
        this.log('info', 'Google Speech-to-Text client initialized');
      } catch (error) {
        this.log('warn', 'Google Cloud Speech package not installed. Install with: npm install @google-cloud/speech');
      }
    } else if (provider === 'assemblyai') {
      // AssemblyAI setup
      try {
        const assemblyai = require('assemblyai');
        assemblyai.settings.apiKey = this.state.apiKey;
        this.state.client = new assemblyai.Transcriber();
        this.log('info', 'AssemblyAI client initialized');
      } catch (error) {
        this.log('warn', 'AssemblyAI package not installed. Install with: npm install assemblyai');
      }
    } else if (provider === 'mock') {
      this.state.client = null;
      this.log('info', 'Mock provider initialized');
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * Transcribe audio to text
   * @param {string|Buffer} audioInput - Path to audio file or audio buffer
   * @param {Object} options - Transcription options
   * @param {boolean} options.timestamps - Include timestamps
   * @param {boolean} options.speakerLabels - Include speaker diarization
   * @returns {Promise<Object>} Transcription result
   */
  async execute(audioInput, options = {}) {
    if (!this._initialized) {
      await this.initialize();
    }

    const { timestamps = false, speakerLabels = false, ...rest } = options;
    const provider = this.state.provider;

    if (provider === 'openai') {
      return await this._transcribeOpenAI(audioInput, timestamps, rest);
    } else if (provider === 'google') {
      return await this._transcribeGoogle(audioInput, timestamps, speakerLabels, rest);
    } else if (provider === 'assemblyai') {
      return await this._transcribeAssemblyAI(audioInput, timestamps, speakerLabels, rest);
    } else if (provider === 'mock') {
      return this._transcribeMock(audioInput);
    } else {
      throw new Error(`Provider ${provider} not supported`);
    }
  }

  /**
   * Transcribe using OpenAI Whisper API
   * @private
   */
  async _transcribeOpenAI(audioInput, timestamps, options) {
    try {
      const client = this.state.client;

      // Handle file path or buffer
      let audioBuffer;
      let filename;

      if (typeof audioInput === 'string') {
        audioBuffer = await fs.readFile(audioInput);
        filename = path.basename(audioInput);
      } else {
        audioBuffer = audioInput;
        filename = 'audio.mp3';
      }

      // Create File object for OpenAI API
      const audioFile = new File([audioBuffer], filename);

      // Transcribe
      const responseFormat = timestamps ? 'verbose_json' : 'text';

      const transcript = await client.audio.transcriptions.create({
        model: this.state.model,
        file: audioFile,
        language: this.state.language,
        response_format: responseFormat,
        ...options
      });

      // Format response
      if (timestamps && transcript.segments) {
        return {
          text: transcript.text,
          language: transcript.language || this.state.language,
          segments: transcript.segments.map(seg => ({
            start: seg.start,
            end: seg.end,
            text: seg.text
          }))
        };
      } else {
        return {
          text: typeof transcript === 'string' ? transcript : transcript.text,
          language: this.state.language
        };
      }
    } catch (error) {
      this.log('error', `OpenAI transcription error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Transcribe using Google Speech-to-Text
   * @private
   */
  async _transcribeGoogle(audioInput, timestamps, speakerLabels, options) {
    // Placeholder for Google implementation
    this.log('info', 'Google Speech-to-Text transcription');

    throw new Error('Google Speech-to-Text integration pending. Add implementation here.');
  }

  /**
   * Transcribe using AssemblyAI
   * @private
   */
  async _transcribeAssemblyAI(audioInput, timestamps, speakerLabels, options) {
    try {
      const transcriber = this.state.client;

      const config = {
        speaker_labels: speakerLabels,
        language_code: this.state.language
      };

      const audioPath = typeof audioInput === 'string' ? audioInput : null;

      if (!audioPath) {
        throw new Error('AssemblyAI requires a file path');
      }

      const transcript = await transcriber.transcribe(audioPath, config);

      const result = {
        text: transcript.text,
        confidence: transcript.confidence,
        language: this.state.language
      };

      if (timestamps && transcript.words) {
        result.segments = transcript.words.map(word => ({
          start: word.start / 1000, // Convert ms to seconds
          end: word.end / 1000,
          text: word.text,
          confidence: word.confidence
        }));
      }

      if (speakerLabels && transcript.utterances) {
        result.speakers = transcript.utterances.map(utt => ({
          speaker: utt.speaker,
          start: utt.start / 1000,
          end: utt.end / 1000,
          text: utt.text
        }));
      }

      return result;
    } catch (error) {
      this.log('error', `AssemblyAI transcription error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mock transcription for testing
   * @private
   */
  _transcribeMock(audioInput) {
    const filename = typeof audioInput === 'string' ? audioInput : 'audio_buffer';
    return {
      text: `Mock transcription of: ${filename}`,
      language: this.state.language,
      confidence: 0.95
    };
  }

  /**
   * Transcribe audio stream in real-time
   * @param {ReadableStream} audioStream - Audio stream
   * @param {Function} callback - Callback for partial results
   * @returns {Promise<Object>} Final transcription result
   */
  async transcribeStream(audioStream, callback = null) {
    // This would implement real-time streaming transcription
    // Provider-dependent implementation
    throw new Error('Streaming transcription not yet implemented');
  }

  /**
   * Set custom vocabulary for better recognition
   * @param {Array<string>} words - Custom words/phrases
   */
  setCustomVocabulary(words) {
    this.state.customVocabulary = words;
    this.log('info', `Custom vocabulary set: ${words.length} words`);
  }
}

module.exports = VoiceTranscriptionAgent;

// Example usage
if (require.main === module) {
  (async () => {
    console.log('Voice Transcription Agent Example');
    console.log('='.repeat(60));

    // Example 1: Mock provider (no API key needed)
    const agent = new VoiceTranscriptionAgent({
      provider: 'mock',
      language: 'en'
    });

    await agent.use(async (agent) => {
      console.log('\n1. Basic transcription (mock):');
      const result = await agent.execute('example_audio.mp3');
      console.log(`   Text: ${result.text}`);
      console.log(`   Language: ${result.language}`);
    });

    // Example 2: OpenAI Whisper (requires API key)
    console.log('\n2. OpenAI Whisper example (commented - requires API key):');
    console.log(`
    const agent = new VoiceTranscriptionAgent({
      provider: 'openai',
      apiKey: 'your-api-key',
      model: 'whisper-1'
    });

    await agent.use(async (agent) => {
      // Simple transcription
      const result = await agent.execute('audio.mp3');
      console.log(result.text);

      // With timestamps
      const resultWithTime = await agent.execute('audio.mp3', { timestamps: true });
      for (const segment of resultWithTime.segments) {
        console.log(\`\${segment.start.toFixed(2)}s - \${segment.end.toFixed(2)}s: \${segment.text}\`);
      }
    });
    `);

    // Example 3: AssemblyAI with speaker diarization
    console.log('\n3. AssemblyAI example (commented - requires API key):');
    console.log(`
    const agent = new VoiceTranscriptionAgent({
      provider: 'assemblyai',
      apiKey: 'your-api-key'
    });

    await agent.use(async (agent) => {
      const result = await agent.execute(
        'meeting.mp3',
        { timestamps: true, speakerLabels: true }
      );

      // Print by speaker
      for (const speaker of result.speakers) {
        console.log(\`Speaker \${speaker.speaker}: \${speaker.text}\`);
      }
    });
    `);
  })();
}
