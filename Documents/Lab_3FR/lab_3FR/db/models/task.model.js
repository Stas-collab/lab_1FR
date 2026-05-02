import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  done: { type: Boolean, default: false },
  priority: { type: String, enum: ['low', 'medium', 'high'], required: true },
  dueDate: { type: String, default: '' },
  image: { type: String, default: null },
});

export const Task = mongoose.model('Task', taskSchema);
