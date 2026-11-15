import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    caseId: { type: String, required: true },
    who: { type: String, required: true },
    priority: { type: String, default: 'Standard review' },
    submitted: { type: String, required: true },
    date: { type: String, required: true },
    note: { type: String, default: '' },
    evidence: { type: [[String]], default: [] },
    conflict: { type: String, default: null },
  },
  { timestamps: true }
);

export const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);
export default Review;
