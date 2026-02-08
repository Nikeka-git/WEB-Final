const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, minlength: 3 },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 6 }
}, { timestamps: true });

userSchema.pre('save', async function() {
    try {
        if (!this.isModified('password')) return;

        this.password = await bcrypt.hash(this.password, 12);
    } catch (error) {
        throw error;
    }
});

userSchema.statics.getStats = async function() {
    const totalUsers = await this.estimatedDocumentCount();
    const totalTutorials = await mongoose.model('Tutorial').estimatedDocumentCount();
    return { totalUsers, totalTutorials };
};

userSchema.methods.comparePassword = async function(password) {
    return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
