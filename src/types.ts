export type Emotion = 'idle' | 'happy' | 'thinking' | 'writing' | 'speaking' | 'overdrive' | 'sleeping';

export type Viseme = 'SILENCE' | 'A_E' | 'I' | 'O_U' | 'M_B_P' | 'OVERDRIVE';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  image?: string;
  codeSnippet?: string;
  modelUsed?: string;
  isStreaming?: boolean;
  suggestions?: string[];
}

export interface MascotConfig {
  name: string;
  type: 'boy' | 'code-kid' | 'ghost';
  customTextureUrl: string | null;
  squishiness: number;
  eyeTrackingEnabled: boolean;
  hapticsEnabled: boolean;
  scale: number;
  accessory: 'none' | 'halo' | 'visor' | 'pet';
}

export interface StageProject {
  id: string;
  title: string;
  description: string;
  code: string;
  updatedAt: number;
  goals?: string[];
  steps?: string[];
  risks?: string[];
  nextSteps?: string;
}

export interface ConsoleLog {
  id: string;
  type: 'log' | 'warn' | 'error' | 'info';
  message: string;
  timestamp: string;
}

export interface SystemSettings {
  aiEngineMode: 'auto' | 'claude' | 'apikey' | 'offline';
  aiModel: 'gemini-3.8-flash' | 'gemini-4-argon' | 'gemini-3.1-flash-lite' | 'demo';
  anthropicApiKey?: string;
  anthropicModel?: string;
  anthropicFastModel?: string;
  highThinking: boolean;
  searchGrounding: boolean;
  appearanceTheme: 'system' | 'dark' | 'light';
  colorAccent: string;
  mascotType: 'boy' | 'code-kid' | 'ghost';
  layoutMode: 'scene-sheet' | 'classic';
  worldBg: 'aurora' | 'nebula' | 'dawn';
  parallaxEnabled: boolean;
  reducedMotion: boolean;
  sensorsEnabled: boolean;
  sfxEnabled: boolean;
  hapticsEnabled: boolean;
  voiceAutoReply: boolean;
  speechLanguage: string;
  bgType: 'planet' | 'particles' | 'custom';
  customBgUrl: string | null;
  customBgIsVideo: boolean;
  activeTheme: 'cyber-obsidian' | 'neon-lime' | 'deep-cyan';
  workspaceMode: 'studio' | 'stage' | 'mascot-lab';
}

