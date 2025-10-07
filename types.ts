

export enum Tool {
    Selection = 'selection',
    Brush = 'brush',
    Arrow = 'arrow',
    Lasso = 'lasso',
    Text = 'text',
    Hand = 'hand',
}

export enum PresetTags {
    CHARACTER = 'character',
    ENVIRONMENT = 'environment',
    STYLE = 'style',
    RETOUCH = 'retouch',
    COMPOSITION = 'composition',
    DESIGN = 'design',
    D3 = 'd3',
}

export enum LiveState {
    IDLE = 'IDLE',
    CONNECTING = 'CONNECTING',
    LISTENING = 'LISTENING',
    THINKING = 'THINKING',
    SPEAKING = 'SPEAKING',
    ERROR = 'ERROR',
}


export interface Point {
    x: number;
    y: number;
}

export interface BaseLayer {
    id: number;
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface ImageLayer extends BaseLayer {
    type: 'image';
    src: string;
}

export interface TextLayer extends BaseLayer {
    type: 'text';
    text: string;
    fontFamily: string;
    fontSize: number;
    color: string;
    align: 'left' | 'center' | 'right';
}

export interface BrushLayer extends BaseLayer {
    type: Tool.Brush;
    points: Point[];
    color: string;
    size: number;
}

export interface LassoLayer extends BaseLayer {
    type: Tool.Lasso;
    points: Point[];
    color: string;
    size: number;
}

export interface ArrowLayer extends BaseLayer {
    type: Tool.Arrow;
    start: Point;
    end: Point;
    color: string;
    size: number;
}

export type AnyLayer = ImageLayer | TextLayer | BrushLayer | LassoLayer | ArrowLayer;

export interface Preset {
    name: string;
    prompt: string;
    description?: string;
    tag: PresetTags;
}

export interface PresetCategory {
    emoji: string;
    category: string;
    presets: Preset[];
}

export interface LogEntry {
    timestamp: string;
    type: 'action' | 'api_request' | 'api_response' | 'error' | 'ui' | 'state' | 'event';
    message: string;
    payload?: any;
}

export interface PromptHistoryEntry {
  prompt: string;
  tags: string[];
}

export interface AnnotationState {
    layers: AnyLayer[];
}

export interface GenerationContext {
  prompt: string;
  annotatedImageSources: { id: number; source: string }[];
  type: 'generate' | 'reasoning' | 'enhance' | 'rtx' | 'mix' | 'outpainting' | 'text-to-image' | 'rep' | 'ref';
}

export interface WorkspaceImage {
  id: number;
  source: File | string;
  x: number;
  y: number;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  layers: AnyLayer[];
  annotationHistory: AnnotationState[];
  annotationHistoryIndex: number;
  isLoading?: boolean;
  isReasoning?: boolean;
  generationContext?: GenerationContext;
}

export interface GoogleUserProfile {
  name: string;
  email: string;
  picture?: string;
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  webViewLink?: string;
}
