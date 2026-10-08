const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const LEVELS_FILE = path.join(__dirname, 'data', 'levels.json');

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Initialize levels data
let levels = [];

// Try to load existing levels, or create default levels
try {
    const fs = require('fs');
    if (fs.existsSync(LEVELS_FILE)) {
        levels = JSON.parse(fs.readFileSync(LEVELS_FILE, 'utf8'));
        // Migrate: add id if missing
        levels = levels.map(level => ({
            ...level,
            id: level.id || Date.now() + Math.random(),
            downloads: level.downloads || 0,
            likes: level.likes || 0,
            created_at: level.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
        }));
    } else {
        // Create 5 main levels as requested
        createDefaultLevels(fs);
    }
} catch (err) {
    console.error('Error loading levels:', err);
    createDefaultLevels();
}

// Create 5 main levels
function createDefaultLevels(fs) {
    const defaultLevels = [
        {
            id: 1,
            name: "Synthwave Beginning",
            author: "GeometryDashFan",
            difficulty: "Normal",
            data: {
                platforms: [
                    { x: 0, y: 450, width: 200, height: 25 }
                ],
                movingPlatforms: [],
                spikes: [],
                orbs: []
            },
            downloads: 0,
            likes: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            id: 2,
            name: "Neon Dash",
            author: "SpeedRunner",
            difficulty: "Easy",
            data: {
                platforms: [
                    { x: 0, y: 450, width: 200, height: 25 },
                    { x: 300, y: 400, width: 150, height: 25 },
                    { x: 550, y: 350, width: 150, height: 25 }
                ],
                movingPlatforms: [],
                spikes: [],
                orbs: [
                    { x: 200, y: 300, size: 30 }
                ]
            },
            downloads: 0,
            likes: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            id: 3,
            name: "Pulse Wave",
            author: "WaveMaster",
            difficulty: "Medium",
            data: {
                platforms: [
                    { x: 0, y: 450, width: 200, height: 25 },
                    { x: 300, y: 400, width: 150, height: 25 },
                    { x: 600, y: 300, width: 100, height: 25 }
                ],
                movingPlatforms: [],
                spikes: [
                    { x: 400, y: 400, width: 30, height: 30, rotation: 0.5 }
                ],
                orbs: [
                    { x: 100, y: 350, size: 30 },
                    { x: 500, y: 250, size: 30 }
                ]
            },
            downloads: 0,
            likes: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            id: 4,
            name: "Electro Fever",
            author: "ElectroKing",
            difficulty: "Hard",
            data: {
                platforms: [
                    { x: 0, y: 450, width: 200, height: 25 },
                    { x: 350, y: 420, width: 150, height: 25 },
                    { x: 600, y: 350, width: 150, height: 25 },
                    { x: 850, y: 300, width: 100, height: 25 }
                ],
                movingPlatforms: [],
                spikes: [
                    { x: 200, y: 400, width: 30, height: 30, rotation: 1.0 },
                    { x: 700, y: 350, width: 30, height: 30, rotation: -1.0 }
                ],
                orbs: [
                    { x: 150, y: 300, size: 30 },
                    { x: 500, y: 200, size: 30 },
                    { x: 800, y: 250, size: 30 }
                ]
            },
            downloads: 0,
            likes: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            id: 5,
            name: "Cyber Loop",
            author: "LoopLegend",
            difficulty: "Hard",
            data: {
                platforms: [
                    { x: 0, y: 450, width: 200, height: 25 },
                    { x: 400, y: 400, width: 200, height: 25 },
                    { x: 700, y: 300, width: 150, height: 25 }
                ],
                movingPlatforms: [
                    { x: 300, y: 350, width: 100, height: 25, isMoving: true, moveDirection: 'horizontal', moveSpeed: 2 }
                ],
                spikes: [
                    { x: 100, y: 400, width: 30, height: 30 },
                    { x: 600, y: 350, width: 30, height: 30 },
                    { x: 900, y: 300, width: 30, height: 30 }
                ],
                orbs: [
                    { x: 200, y: 300, size: 30 },
                    { x: 500, y: 250, size: 30 },
                    { x: 800, y: 200, size: 30 }
                ]
            },
            downloads: 0,
            likes: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    ];

    levels = defaultLevels;
    saveLevels(fs);
}

// Save levels to file
function saveLevels(fs) {
    try {
        fs.mkdirSync(path.dirname(LEVELS_FILE), { recursive: true });
        fs.writeFileSync(LEVELS_FILE, JSON.stringify(levels, null, 2));
        console.log(`Saved ${levels.length} levels to ${LEVELS_FILE}`);
    } catch (err) {
        console.error('Error saving levels:', err);
    }
}

// GET all levels
app.get('/api/levels', (req, res) => {
    try {
        res.json({ success: true, levels });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET a specific level
app.get('/api/levels/:id', (req, res) => {
    try {
        const level = levels.find(l => l.id === parseInt(req.params.id));
        if (!level) {
            return res.status(404).json({ success: false, error: 'Level not found' });
        }
        // Increment downloads
        level.downloads = (level.downloads || 0) + 1;
        saveLevels(require('fs'));
        res.json({ success: true, level });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST - Publish a new level
app.post('/api/levels', (req, res) => {
    try {
        const { name, author, data, difficulty } = req.body;
        
        if (!name || !author || !data) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        const newLevel = {
            id: Date.now() + Math.random(),
            name,
            author,
            data,
            difficulty: difficulty || 'Normal',
            downloads: 0,
            likes: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        levels.push(newLevel);
        saveLevels(require('fs'));

        res.json({ success: true, level: newLevel });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// PUT - Update a level
app.put('/api/levels/:id', (req, res) => {
    try {
        const { name, author, data, difficulty } = req.body;
        const id = parseInt(req.params.id);
        
        const index = levels.findIndex(l => l.id === id);
        if (index === -1) {
            return res.status(404).json({ success: false, error: 'Level not found' });
        }

        levels[index] = {
            ...levels[index],
            name: name || levels[index].name,
            author: author || levels[index].author,
            data: data || levels[index].data,
            difficulty: difficulty || levels[index].difficulty,
            updated_at: new Date().toISOString()
        };

        saveLevels(require('fs'));

        res.json({ success: true, level: levels[index] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE a level
app.delete('/api/levels/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        levels = levels.filter(l => l.id !== id);
        saveLevels(require('fs'));
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Like a level
app.post('/api/levels/:id/like', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const level = levels.find(l => l.id === id);
        
        if (!level) {
            return res.status(404).json({ success: false, error: 'Level not found' });
        }

        level.likes = (level.likes || 0) + 1;
        saveLevels(require('fs'));

        res.json({ success: true, likes: level.likes });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Serve the main page for all other routes (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Levels data: ${levels.length} levels loaded`);
  console.log('Default 5 levels included');
});

// Graceful shutdown
// Note: File-based persistence means data stays on disk even if server shuts down