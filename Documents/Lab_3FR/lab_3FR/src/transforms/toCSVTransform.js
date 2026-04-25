import { Transform } from 'stream';

/**
 * Transform stream (objectMode → string) — перетворює об'єкт задачі
 * на CSV рядок. Перший виклик додає заголовок.
 */
export class ToCSVTransform extends Transform {
  constructor(withOverdue = false) {
    super({ objectMode: true });
    this._headerWritten = false;
    this._withOverdue = withOverdue;
  }

  _transform(task, _encoding, callback) {
    if (!this._headerWritten) {
      const header = this._withOverdue
        ? 'id,title,done,priority,dueDate,isOverdue\n'
        : 'id,title,done,priority,dueDate\n';
      this.push(header);
      this._headerWritten = true;
    }

    const row = this._withOverdue
      ? `${task.id},"${task.title}",${task.done},${task.priority},${task.dueDate ?? ''},${task.isOverdue}\n`
      : `${task.id},"${task.title}",${task.done},${task.priority},${task.dueDate ?? ''}\n`;

    callback(null, row);
  }
}
