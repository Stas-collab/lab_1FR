import { Transform } from 'stream';

/**
 * Transform stream (objectMode) — додає поле isOverdue: boolean
 * на основі dueDate порівняно з поточною датою.
 */
export class OverdueTransform extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _transform(task, _encoding, callback) {
    const isOverdue = task.dueDate ? new Date(task.dueDate) < new Date() && !task.done : false;

    callback(null, { ...task, isOverdue });
  }
}
