export type ModeType = 'kid' | 'expert' | 'inshort' | null;

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  mode?: ModeType;
}