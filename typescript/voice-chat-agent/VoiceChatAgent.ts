/**
 * Voice Chat Agent - Full voice-based conversational AI for Supabase
 *
 * Combines speech-to-text, LLM chat, and text-to-speech
 * Can be deployed as Supabase Edge Function
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

interface VoiceChatConfig {
  sttProvider?: 'openai';
  ttsProvider?: 'openai';
  llmProvider?: 'anthropic' | 'openai';
  sttApiKey?: string;
  ttsApiKey?: string;
  llmApiKey?: string;
  voice?: string;
  speechSpeed?: number;
  model?: string;
  systemPrompt?: string;
  language?: string;
  maxHistory?: number;
}

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface VoiceChatResult {
  userText: string;
  aiText: string;
  audioBuffer: ArrayBuffer;
  conversationHistory: Message[];
}

export class VoiceChatAgent {
  private sttClient: OpenAI | null = null;
  private ttsClient: OpenAI | null = null;
  private llmClient: Anthropic | OpenAI | null = null;
  private config: Required<VoiceChatConfig>;
  private messages: Message[] = [];

  constructor(config: VoiceChatConfig = {}) {
    this.config = {
      sttProvider: config.sttProvider || 'openai',
      ttsProvider: config.ttsProvider || 'openai',
      llmProvider: config.llmProvider || 'anthropic',
      sttApiKey: config.sttApiKey || process.env.STT_API_KEY || '',
      ttsApiKey: config.ttsApiKey || process.env.TTS_API_KEY || '',
      llmApiKey: config.llmApiKey || process.env.LLM_API_KEY || '',
      voice: config.voice || 'nova',
      speechSpeed: config.speechSpeed || 1.0,
      model: config.model || 'claude-3-5-sonnet-20241022',
      systemPrompt: config.systemPrompt || 'You are a helpful voice assistant. Keep responses concise and conversational.',
      language: config.language || 'en',
      maxHistory: config.maxHistory || 10
    };

    this.initialize();
  }

  private initialize(): void {
    // Initialize STT
    if (this.config.sttProvider === 'openai') {
      this.sttClient = new OpenAI({ apiKey: this.config.sttApiKey });
    }

    // Initialize TTS
    if (this.config.ttsProvider === 'openai') {
      this.ttsClient = new OpenAI({ apiKey: this.config.ttsApiKey });
    }

    // Initialize LLM
    if (this.config.llmProvider === 'anthropic') {
      this.llmClient = new Anthropic({ apiKey: this.config.llmApiKey });
    } else if (this.config.llmProvider === 'openai') {
      this.llmClient = new OpenAI({ apiKey: this.config.llmApiKey });
    }

    // Add system message
    if (this.config.systemPrompt) {
      this.messages.push({
        role: 'system',
        content: this.config.systemPrompt
      });
    }
  }

  async execute(audioInput: File | Blob): Promise<VoiceChatResult> {
    // Step 1: Transcribe user's speech
    const userText = await this.transcribe(audioInput);

    // Step 2: Generate AI response
    const aiText = await this.generateResponse(userText);

    // Step 3: Synthesize AI's response to speech
    const audioBuffer = await this.synthesize(aiText);

    return {
      userText,
      aiText,
      audioBuffer,
      conversationHistory: this.messages
    };
  }

  private async transcribe(audioInput: File | Blob): Promise<string> {
    if (!this.sttClient) {
      throw new Error('STT client not initialized');
    }

    const transcript = await this.sttClient.audio.transcriptions.create({
      model: 'whisper-1',
      file: audioInput as File,
      language: this.config.language
    });

    return transcript.text;
  }

  private async generateResponse(userText: string): Promise<string> {
    // Add user message to history
    this.messages.push({
      role: 'user',
      content: userText
    });

    let responseText: string;

    if (this.config.llmProvider === 'anthropic' && this.llmClient) {
      const client = this.llmClient as Anthropic;

      // Separate system message
      const systemMsg = this.config.systemPrompt;
      const conversation = this.messages.filter(m => m.role !== 'system');

      const response = await client.messages.create({
        model: this.config.model,
        max_tokens: 1024,
        system: systemMsg,
        messages: conversation as Anthropic.Messages.MessageParam[]
      });

      responseText = (response.content[0] as Anthropic.Messages.TextBlock).text;
    } else if (this.config.llmProvider === 'openai' && this.llmClient) {
      const client = this.llmClient as OpenAI;

      const response = await client.chat.completions.create({
        model: this.config.model,
        messages: this.messages as OpenAI.Chat.ChatCompletionMessageParam[]
      });

      responseText = response.choices[0].message.content || '';
    } else {
      throw new Error('LLM client not initialized');
    }

    // Add AI response to history
    this.messages.push({
      role: 'assistant',
      content: responseText
    });

    // Trim history if needed
    this.trimHistory();

    return responseText;
  }

  private async synthesize(text: string): Promise<ArrayBuffer> {
    if (!this.ttsClient) {
      throw new Error('TTS client not initialized');
    }

    const response = await this.ttsClient.audio.speech.create({
      model: 'tts-1',
      voice: this.config.voice as any,
      input: text,
      speed: this.config.speechSpeed
    });

    return await response.arrayBuffer();
  }

  private trimHistory(): void {
    const maxHistory = this.config.maxHistory;

    if (this.messages.length > maxHistory + 1) {
      const systemMsg = this.messages[0];
      this.messages = [systemMsg, ...this.messages.slice(-(maxHistory))];
    }
  }

  async chatText(text: string): Promise<{ text: string; audio: ArrayBuffer }> {
    const aiText = await this.generateResponse(text);
    const audioBuffer = await this.synthesize(aiText);

    return {
      text: aiText,
      audio: audioBuffer
    };
  }

  getHistory(): Message[] {
    return this.messages;
  }

  clearHistory(): void {
    const systemMsg = this.messages[0];
    this.messages = systemMsg ? [systemMsg] : [];
  }

  setVoice(voice: string): void {
    this.config.voice = voice;
  }

  setSpeechSpeed(speed: number): void {
    this.config.speechSpeed = Math.max(0.25, Math.min(4.0, speed));
  }
}

export default VoiceChatAgent;
