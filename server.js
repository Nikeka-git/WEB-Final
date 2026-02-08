require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./utils/errorHandler');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Tutorial = require('./models/Tutorial');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const tutorialRoutes = require('./routes/tutorials');

const getCurrentUser = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) return next();

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('username');
        req.user = user;
        next();
    } catch (error) {
        next();
    }
};


connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(getCurrentUser);

app.get('/api/tutorials/public', async (req, res) => {
    try {
        const tutorials = await Tutorial.find({ published: true })
            .populate('author', 'username')
            .sort({ createdAt: -1 })
            .limit(10);
        res.json(tutorials);
    } catch (error) {
        console.error('Public tutorials error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/tutorials/public/:id', async (req, res) => {
    try {
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Invalid ID' });
        }

        const tutorial = await Tutorial.findOne({
            _id: req.params.id,
            published: true
        }).populate('author', 'username');

        if (!tutorial) {
            return res.status(404).json({ message: 'Not found' });
        }

        tutorial.views += 1;
        await tutorial.save();
        res.json(tutorial);
    } catch (error) {
        console.error('Public tutorial error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/tutorials', async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Login required' });

        const tutorial = new Tutorial({
            ...req.body,
            author: req.user._id,
            published: true
        });

        await tutorial.save();
        const populated = await Tutorial.findById(tutorial._id).populate('author', 'username');
        res.status(201).json(populated);
    } catch (error) {
        console.error('Create tutorial error:', error);
        res.status(400).json({ message: error.message });
    }
});

app.get('/api/tutorials', async (req, res) => {
    try {
        const Tutorial = require('./models/Tutorial');
        const tutorials = await Tutorial.find()
            .populate('author', 'username')
            .sort({ createdAt: -1 });
        res.json(tutorials);
    } catch (error) {
        console.error('Get tutorials error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/tutorials/:id', async (req, res) => {
    try {
        const Tutorial = require('./models/Tutorial');
        const tutorial = await Tutorial.findById(req.params.id)
            .populate('author', 'username');
        if (!tutorial) return res.status(404).json({ message: 'Not found' });
        res.json(tutorial);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.put('/api/tutorials/:id', async (req, res) => {
    try {
        const Tutorial = require('./models/Tutorial');
        const tutorial = await Tutorial.findByIdAndUpdate(
            req.params.id,
            { ...req.body, published: req.body.published !== false },
            { new: true }
        ).populate('author', 'username');
        if (!tutorial) return res.status(404).json({ message: 'Not found' });
        res.json(tutorial);
    } catch (error) {
        console.error('Update tutorial error:', error);
        res.status(400).json({ message: error.message });
    }
});

app.delete('/api/tutorials/:id', async (req, res) => {
    try {
        const Tutorial = require('./models/Tutorial');
        const tutorial = await Tutorial.findByIdAndDelete(req.params.id);
        if (!tutorial) return res.status(404).json({ message: 'Not found' });
        res.json({ message: 'Tutorial deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.use(express.static('public'));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tutorials', tutorialRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/stats', async (req, res) => {
    try {
        const [totalUsers, totalTutorials, statsResult] = await Promise.all([
            User.estimatedDocumentCount(),
            Tutorial.estimatedDocumentCount(),
            Tutorial.aggregate([
                { $group: { _id: null, totalViews: { $sum: '$views' } } }
            ])
        ]);

        const totalViews = statsResult[0]?.totalViews || 0;

        res.json({
            tutorials: totalTutorials,
            authors: totalUsers,
            views: totalViews
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ message: 'Stats unavailable' });
    }
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));
