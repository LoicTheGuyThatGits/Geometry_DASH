let network = null;
let gameState = 'menu'; // menu, playing, editor, levelSelect
let currentLevel = null;
let levels = [];
let editedLevel = {
    name: 'My Level',
    author: 'Player',
    difficulty: 'Normal',
    platforms: [],
    movingPlatforms: [],
    spikes: [],
    orbs: [],
    gravity: 1
};

// Check if we're on the server or just running locally
const isServer = typeof require !== 'undefined' && require.main === module;

// p5.js sketch
function Sketch(p) {
    let canvas;
    let player = {
        x: 100,
        y: 0,
        width: 20,
        height: 20,
        velocityX: 0,
        velocityY: 0,
        isJumping: false,
        rotation: 0,
        speed: 5
    };
    
    let keys = {};
    let showGrid = true;
    
    p.setup = () => {
        canvas = p.createCanvas(p.windowWidth - 40, p.height - 200);
        canvas.parent('gameCanvas');
        p.frameRate(60);
        
        // Reset player
        player.x = 100;
        player.y = 500;
        player.velocityY = 0;
        player.isJumping = false;
        
        // Setup keyboard controls
        p.keyPressed = () => { keys[p.key] = true; };
        p.keyReleased = () => { keys[p.key] = false; };
        
        p.redraw();
    };
    
    p.draw = () => {
        p.background(10, 10, 20);
        
        // Draw ground
        p.fill(50, 50, 50);
        p.noStroke();
        p.rect(0, p.height - 50, p.width, 50);
        
        // Draw grid
        if (showGrid) {
            p.stroke(50, 50, 50, 30);
            p.strokeWeight(1);
            for (let x = 0; x < p.width; x += 50) {
                p.line(x, 0, x, p.height);
            }
            for (let y = 0; y < p.height; y += 50) {
                p.line(0, y, p.width, y);
            }
        }
        
        // Draw platforms
        p.fill(100, 200, 255, 150);
        p.noStroke();
        editedLevel.platforms.forEach(plat => {
            p.rect(plat.x, plat.y, plat.width, plat.height);
        });
        
        // Draw moving platforms
        p.fill(255, 255, 100, 200);
        editedLevel.movingPlatforms.forEach(plat => {
            p.rect(plat.x, plat.y, plat.width, plat.height);
        });
        
        // Draw spikes
        editedLevel.spikes.forEach(spike => {
            p.fill(255, 0, 0);
            p.noStroke();
            p.push();
            p.translate(spike.x + spike.width/2, spike.y + spike.height/2);
            p.rotate(spike.rotation || 0);
            p.triangle(
                -spike.width/2, spike.height/2,
                spike.width/2, spike.height/2,
                0, -spike.height/2
            );
            p.pop();
        });
        
        // Draw orbs
        editedLevel.orbs.forEach(orb => {
            p.fill(255, 100, 255);
            p.noStroke();
            p.push();
            p.translate(orb.x + orb.size/2, orb.y + orb.size/2);
            p.rotate(p.frameCount * 0.03);
            p.ellipse(0, 0, orb.size, orb.size);
            p.pop();
        });
        
        // Draw player
        p.fill(255, 0, 255);
        p.noStroke();
        p.push();
        p.translate(player.x, player.y);
        p.rotate(player.rotation);
        p.rect(-player.width/2, -player.height/2, player.width, player.height);
        p.pop();
        
        // Physics and collision (only when playing)
        if (gameState === 'playing') {
            // Gravity
            player.velocityY += editedLevel.gravity * p.deltaTime / 16;
            player.y += player.velocityY * p.deltaTime / 16;
            player.x += player.velocityX * p.deltaTime / 16;
            
            // Collision with ground
            if (player.y + player.height >= p.height - 50) {
                player.y = p.height - 50 - player.height;
                player.velocityY = 0;
                player.isJumping = false;
            }
            
            // Collision with platforms
            editedLevel.platforms.forEach(plat => {
                if (player.x < plat.x + plat.width &&
                    player.x + player.width > plat.x &&
                    player.y < plat.y + plat.height &&
                    player.y + player.height > plat.y) {
                    
                    if (player.velocityY > 0) {
                        player.y = plat.y - player.height;
                        player.velocityY = 0;
                        player.isJumping = false;
                    }
                }
            });
            
            // Collision with moving platforms
            editedLevel.movingPlatforms.forEach(plat => {
                if (player.x < plat.x + plat.width &&
                    player.x + player.width > plat.x &&
                    player.y < plat.y + plat.height &&
                    player.y + player.height > plat.y) {
                    
                    if (player.velocityY > 0) {
                        player.y = plat.y - player.height;
                        player.velocityY = 0;
                        player.isJumping = false;
                    }
                }
            });
            
            // Spike collision
            editedLevel.spikes.forEach(spike => {
                if (player.x < spike.x + spike.width &&
                    player.x + player.width > spike.x &&
                    player.y < spike.y + spike.height &&
                    player.y + player.height > spike.y) {
                    
                    // Reset on death
                    player.x = 100;
                    player.y = 500;
                    player.velocityY = 0;
                    player.isJumping = false;
                    console.log('Died!');
                }
            });
            
            // Orb collection
            editedLevel.orbs.forEach((orb, index) => {
                if (player.x < orb.x + orb.size &&
                    player.x + player.width > orb.x &&
                    player.y < orb.y + orb.size &&
                    player.y + player.height > orb.y) {
                    
                    editedLevel.orbs.splice(index, 1);
                    console.log('Collected orb!');
                }
            });
            
            // Player controls
            if (keys['SPACE'] || keys['W'] || keys['UP']) {
                if (!player.isJumping) {
                    player.velocityY = -15;
                    player.isJumping = true;
                }
            }
            
            if (keys['A'] || keys['LEFT']) {
                player.velocityX = -player.speed;
                player.rotation = -0.2;
            } else if (keys['D'] || keys['RIGHT']) {
                player.velocityX = player.speed;
                player.rotation = 0.2;
            } else {
                player.velocityX = 0;
                player.rotation = 0;
            }
            
            p.redraw();
        }
    };
}

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize p5.js
    new p5(Sketch, 'gameCanvas');
    
    // Initialize network
    initNetwork();
    
    // Setup event listeners
    setupEventListeners();
});

function initNetwork() {
    network = {
        getLevels: async () => {
            try {
                const response = await fetch('/api/levels');
                if (response.ok) {
                    levels = await response.json();
                    renderLevels();
                }
            } catch (err) {
                console.error('Failed to get levels:', err);
                // Fallback to empty levels
                levels = [];
                renderLevels();
            }
        },
        publishLevel: async (levelData) => {
            try {
                const response = await fetch('/api/levels', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(levelData)
                });
                if (response.ok) {
                    const newLevel = await response.json();
                    levels.unshift(newLevel);
                    renderLevels();
                    return newLevel;
                }
            } catch (err) {
                console.error('Failed to publish level:', err);
            }
        },
        deleteLevel: async (levelId) => {
            try {
                const response = await fetch(`/api/levels/${levelId}`, {
                    method: 'DELETE'
                });
                if (response.ok) {
                    levels = levels.filter(l => l.id !== parseInt(levelId));
                    renderLevels();
                }
            } catch (err) {
                console.error('Failed to delete level:', err);
            }
        }
    };
    
    // Initial load
    network.getLevels();
}

function setupEventListeners() {
    // Menu buttons
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.getAttribute('data-action');
            handleMenuAction(action);
        });
    });
    
    // Level card clicks
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('level-card')) {
            const levelId = e.target.getAttribute('data-level-id');
            loadLevel(levelId);
        }
    });
    
    // Editor controls
    document.getElementById('btnJump')?.addEventListener('click', () => {
        if (gameState === 'playing') {
            // Trigger jump via key event
            keys['SPACE'] = true;
            setTimeout(() => { keys['SPACE'] = false; }, 100);
        }
    });
    
    document.getElementById('btnSave')?.addEventListener('click', saveLevel);
    
    // Keyboard controls while playing
    window.addEventListener('keydown', (e) => {
        keys[e.key] = true;
        
        if (e.key === 'Escape' && gameState === 'playing') {
            gameState = 'menu';
            document.getElementById('levelBrowser').style.display = 'block';
            document.getElementById('editorSection').style.display = 'none';
        }
    });
    
    window.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });
    
    // Platform creation on canvas click (in editor mode)
    canvas.addEventListener('click', (e) => {
        if (gameState === 'editor') {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Create platform at click position
            editedLevel.platforms.push({
                x: Math.max(0, x - 50),
                y: Math.max(0, y - 25),
                width: 100,
                height: 25,
                isMoving: false
            });
            
            console.log('Platform created:', editedLevel.platforms[editedLevel.platforms.length - 1]);
        }
    });
}

function handleMenuAction(action) {
    const levelSelect = document.getElementById('levelSelect');
    const editor = document.getElementById('editorSection');
    const levelBrowser = document.getElementById('levelBrowser');
    
    levelSelect.style.display = 'none';
    editor.style.display = 'none';
    levelBrowser.style.display = 'none';
    
    switch(action) {
        case 'create':
            // Initialize editor
            currentLevel = null;
            editedLevel = {
                name: 'My Level',
                author: 'Player',
                difficulty: 'Normal',
                platforms: [],
                movingPlatforms: [],
                spikes: [],
                orbs: [],
                gravity: 1
            };
            
            document.getElementById('levelName').textContent = editedLevel.name;
            document.getElementById('levelDifficulty').textContent = editedLevel.difficulty;
            document.getElementById('gameCanvas').style.display = 'block';
            gameState = 'editor';
            levelBrowser.style.display = 'block';
            break;
            
        case 'browse':
            gameState = 'menu';
            levelBrowser.style.display = 'block';
            break;
            
        case 'play':
            if (currentLevel) {
                gameState = 'playing';
                // Reset player position for this level
                player.x = 100;
                player.y = 500;
                player.velocityY = 0;
                player.isJumping = false;
            }
            break;
            
        case 'back':
            gameState = 'menu';
            levelBrowser.style.display = 'block';
            break;
    }
}

function loadLevel(levelId) {
    currentLevel = levels.find(l => l.id === parseInt(levelId));
    if (!currentLevel) return;
    
    // Copy level data for editing
    editedLevel = {
        name: currentLevel.name,
        author: currentLevel.author || 'Unknown',
        difficulty: currentLevel.difficulty || 'Normal',
        platforms: currentLevel.data?.platforms || [],
        movingPlatforms: currentLevel.data?.movingPlatforms || [],
        spikes: currentLevel.data?.spikes || [],
        orbs: currentLevel.data?.orbs || [],
        gravity: currentLevel.data?.gravity || 1
    };
    
    // Update UI
    document.getElementById('levelName').textContent = editedLevel.name;
    document.getElementById('levelDifficulty').textContent = editedLevel.difficulty;
    document.getElementById('levelDownloads').textContent = currentLevel.downloads || 0;
    document.getElementById('levelLikes').textContent = currentLevel.likes || 0;
    
    // Show editor, hide browser
    document.getElementById('levelBrowser').style.display = 'none';
    document.getElementById('editorSection').style.display = 'block';
    document.getElementById('gameCanvas').style.display = 'block';
    
    gameState = 'editor';
    console.log('Loaded level:', currentLevel.name);
}

function saveLevel() {
    // Update level name from UI
    editedLevel.name = document.getElementById('levelName').textContent;
    editedLevel.difficulty = document.getElementById('levelDifficulty').textContent;
    
    // Publish to server
    network.publishLevel({
        name: editedLevel.name,
        author: editedLevel.author,
        data: editedLevel,
        difficulty: editedLevel.difficulty
    });
    
    // Reset to browser mode
    gameState = 'menu';
    document.getElementById('levelBrowser').style.display = 'block';
    document.getElementById('editorSection').style.display = 'none';
    console.log('Level saved!');
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Sketch, editedLevel, gameState, levels, network, handleMenuAction, loadLevel, saveLevel };
}