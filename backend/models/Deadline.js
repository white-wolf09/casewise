import mongoose from 'mongoose';

const deadlineSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    day: { type: String, required: true },
    month: { type: String, required: true },
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    tag: { type: String, default: '' },
    tone: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Deadline = mongoose.models.Deadline || mongoose.model('Deadline', deadlineSchema);
export default Deadline;
