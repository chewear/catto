# Catto

A lightweight, browser-based arena survival game where you control a cat fighting off waves of enemies. Built with vanilla JavaScript and HTML5 Canvas, featuring an upgrade system, multiple abilities, and progressive difficulty scaling.

## 🎮 Game Overview

Catto is a top-down survival game where you control a cat character defending against waves of increasingly difficult enemies. Collect experience points, level up, and choose from various ability upgrades to survive longer and achieve higher scores.

## ✨ Features

### Core Gameplay
- **Survival Mechanics**: Fight off waves of enemies while managing health and resources
- **Progressive Difficulty**: Enemy strength and spawn rates increase over time
- **Wave System**: New enemy types unlock as you progress through waves
- **Experience System**: Gain XP from defeated enemies to level up

### Abilities & Upgrades
- **Claw Orbit**: Rotating claws that deal continuous damage
- **Whisker Whip**: Forward-projecting whip attacks
- **Hairball Burst**: Random-direction projectile attacks
- **Paw Slam**: Area-of-effect ground slam attacks
- **Cat Nap**: Healing ability with temporary invulnerability

### Enemy Types
- **Street Rat**: Fast, weak enemies (early game)
- **Stray Dog**: Medium health and damage (mid game)
- **Cursed Crow**: High health, threatening enemies (late game)

### Technical Features
- **Sprite-based Graphics**: Custom cat, enemy, and ability sprites
- **Responsive Controls**: WASD and arrow key support
- **High Score Persistence**: Local storage for score tracking
- **Smooth Animation**: 60 FPS gameplay with requestAnimationFrame
- **Fallback Rendering**: Graceful degradation if sprites fail to load

## 🎯 Controls

- **W / ↑**: Move up
- **S / ↓**: Move down
- **A / ←**: Move left
- **D / →**: Move right
- **Pause**: Game automatically pauses during level-up selection

## 🚀 Installation & Setup

### Prerequisites
- Modern web browser with HTML5 Canvas support
- No external dependencies or build tools required

### Quick Start
1. Clone or download the project files
2. Open `index.html` in your web browser
3. Wait for sprites to load
4. Click "Start Game" to begin playing

### File Structure
```
catto/
├── index.html          # Main HTML file with game UI
├── game.js            # Core game logic and mechanics
├── styles.css         # Game styling and UI layout
└── assets/            # Game sprites and images
    ├── neko.png       # Player cat sprite
    ├── dog.png        # Dog enemy sprite
    ├── crow.png       # Crow enemy sprite
    ├── rat.png        # Rat enemy sprite
    └── paw.png        # Claw/paw ability sprite
```

## 🎲 Gameplay Mechanics

### Leveling System
- Gain XP by defeating enemies
- Level up to unlock ability upgrades
- Choose from 2 random upgrades per level
- XP requirements scale progressively

### Difficulty Scaling
- **Wave-based**: New enemy types unlock every 25 seconds
- **Level-based**: Enemy stats increase with player level
- **Time-based**: Spawn rates and enemy caps increase over time
- **Capped scaling**: Maximum limits prevent impossible difficulty

### Combat System
- **Automatic abilities**: Claw orbit and timed abilities activate automatically
- **Manual positioning**: Strategic movement to avoid enemy contact
- **Invulnerability frames**: Brief protection after taking damage
- **Collision detection**: Precise hitbox calculations for all entities

## 🛠️ Technical Implementation

### Architecture
- **Canvas-based rendering**: 2D context for smooth graphics
- **Entity-Component pattern**: Separate arrays for different game object types
- **State management**: Centralized game state with immutable-like updates
- **Event-driven input**: Keyboard event listeners for responsive controls


### Browser Compatibility
- **Modern browsers**: Chrome, Firefox, Safari, Edge
- **Canvas support**: Requires HTML5 Canvas API
- **Local storage**: High score persistence
- **No polyfills**: Pure vanilla JavaScript implementation

## 🎨 Customization

### Modifying Game Balance
- Adjust enemy stats in `enemyTypes` object
- Modify ability scaling in `abilities` configuration
- Change XP requirements in `levelUp()` function
- Tune spawn rates in `spawnEnemies()` function

### Adding New Content
- **New abilities**: Extend the `abilities` object
- **New enemies**: Add to `enemyTypes` and sprite loading
- **New mechanics**: Implement in game loop functions
- **UI elements**: Extend HTML and CSS as needed

## 🐛 Known Issues & Limitations
- **Sprite dependency**: Game requires all sprite files to be present
- **Fixed resolution**: Canvas size is hardcoded (1200x800)
- **Local-only**: No online multiplayer or cloud saves
- **Mobile support**: Designed for desktop keyboard input

---

**Enjoy playing Catto!** 🐾

*Survive as long as you can, level up your abilities, and beat your high score!*
