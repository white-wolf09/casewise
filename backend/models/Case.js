import mongoose from 'mongoose';

const flagSchema = new mongoose.Schema({
  id: { type: String, required: true },
  kind: { type: String, enum: ['crit', 'miss'], default: 'miss' },
  label: { type: String, required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
}, { _id: false });

const factSchema = new mongoose.Schema({
  label: { type: String, required: true },
  value: { type: String, required: true },
  source: { type: String, required: true },
}, { _id: false });

const documentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  meta: { type: String, required: true },
  date: { type: String, required: true },
}, { _id: false });

const timelineSchema = new mongoose.Schema({
  date: { type: String, required: true },
  text: { type: String, required: true },
}, { _id: false });

const checklistSchema = new mongoose.Schema({
  label: { type: String, required: true },
  done: { type: Boolean, default: false },
}, { _id: false });

const caseSchema = new mongoose.Schema(
  {
    caseId: { type: String, required: true, unique: true, index: true },
    clientName: { type: String, required: true },
    ini: { type: String, required: true },
    tone: { type: String, default: 'blue' },
    type: { type: String, required: true },
    assignee: { type: String, required: true },
    deadline: { type: String, default: '—' },
    health: { type: Number, default: 100 },
    openFlags: { type: Number, default: 0 },
    status: { type: String, enum: ['Urgent', 'Active', 'Review'], default: 'Active' },
    meta: {
      supervisor: { type: String, default: 'Sarah Patel' },
      nextDeadline: { type: String, default: '—' },
      opened: { type: String, required: true },
    },
    flags: [flagSchema],
    facts: [factSchema],
    documents: [documentSchema],
    timeline: [timelineSchema],
    checklist: [checklistSchema],
  },
  { timestamps: true }
);

export const Case = mongoose.models.Case || mongoose.model('Case', caseSchema);
export default Case;
