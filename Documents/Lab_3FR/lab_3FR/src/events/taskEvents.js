import { EventEmitter } from 'events';

// Глобальна шина подій між REST контролерами та WebSocket
export const taskEvents = new EventEmitter();
