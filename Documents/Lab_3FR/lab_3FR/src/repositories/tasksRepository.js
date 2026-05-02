import { Task } from '../../db/models/task.model.js';

const toDTO = (doc) => {
  if (!doc) return null;
  const { _id, __v, ...rest } = doc;
  return { id: _id.toString(), ...rest };
};

export const createTasksRepository = () => ({
  async findAll() {
    const docs = await Task.find({}).lean();
    return docs.map(toDTO);
  },

  async findById(id) {
    try {
      const doc = await Task.findById(id).lean();
      return toDTO(doc);
    } catch {
      return null;
    }
  },

  async create(data) {
    const doc = await Task.create(data);
    return toDTO(doc.toObject());
  },

  async update(id, updates) {
    try {
      delete updates.id;
      const doc = await Task.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
      return toDTO(doc);
    } catch {
      return null;
    }
  },

  async remove(id) {
    try {
      const result = await Task.findByIdAndDelete(id);
      return !!result;
    } catch {
      return false;
    }
  },
});
