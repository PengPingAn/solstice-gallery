export interface PhotoItem {
  id: string | number;
  url: string;
  title?: string;
  meta?: string;
  date?: string;
  address?: string;
  [key: string]: any;
}

export interface EmojiItem {
  id: string;
  emoji: string;
  label: string;
  src: string;
  count: number;
}

export interface TransformState {
  scale: number;
  position: { x: number; y: number };
}

export interface SwipeState {
  isSwiping: boolean;
  startX: number;
  startY: number;
  currentX: number;
  deltaX: number;
  deltaY: number;
  direction: number;
  opacity: number;
  isHorizontalSwipe: boolean;
}
