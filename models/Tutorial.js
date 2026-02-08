const mongoose = require('mongoose');

const tutorialSchema = new mongoose.Schema({
    title: { type: String, required: true },
    sections: [{
        title: { type: String, required: true },
        content: { type: String, required: true },
        quiz: [{
            question: { type: String, required: true },
            options: [{ type: String, required: true }],
            correct: { type: Number, required: true }
        }]
    }],
    tags: [String],
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    views: { type: Number, default: 0 },
    published: { type: Boolean, default: true }
}, { timestamps: true });

tutorialSchema.statics.getStats = async function() {
    const totalTutorials = await this.estimatedDocumentCount();
    const stats = await this.aggregate([
        { $group: { _id: null, totalViews: { $sum: '$views' } } }
    ]);
    return {
        totalTutorials,
        totalViews: stats[0]?.totalViews || 0
    };
};

module.exports = mongoose.model('Tutorial', tutorialSchema);
