const express = require('express');
const auth = require('../middleware/auth');
const Tutorial = require('../models/Tutorial');
const { tutorialSchema } = require('../middleware/validate');
const router = express.Router();

router.get('/', auth, async (req, res) => {
    try {
        const filter = { author: req.user.id };

        if (req.query.published === 'true') {
            filter.published = true;
        } else if (req.query.published === 'false') {
            filter.published = false;
        }

        const tutorials = await Tutorial.find(filter)
            .populate('author', 'username')
            .sort({ createdAt: -1 });

        console.log(`User ${req.user.id} tutorials:`, tutorials.length);

        res.json(tutorials);
    } catch (error) {
        console.error('GET tutorials error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/:id', auth, async (req, res) => {
    const tutorial = await Tutorial.findOne({ _id: req.params.id, author: req.user.id }).populate('author', 'username');
    if (!tutorial) return res.status(404).json({ message: 'Not found' });
    res.json(tutorial);
});

router.put('/:id', auth, async (req, res) => {
    const tutorial = await Tutorial.findOneAndUpdate(
        { _id: req.params.id, author: req.user.id },
        req.body,
        { new: true }
    );
    if (!tutorial) return res.status(404).json({ message: 'Not found' });
    res.json(tutorial);
});

router.delete('/:id', auth, async (req, res) => {
    const tutorial = await Tutorial.findOneAndDelete({ _id: req.params.id, author: req.user.id });
    if (!tutorial) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
});

module.exports = router;
