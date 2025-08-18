const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let gameState = {
    player: {
        x: 400,
        y: 300,
        hp: 100,
        maxHp: 100, // Fixed at 100
        level: 1,
        xp: 0,
        xpNext: 10,
        speed: 3
    },
    time: 0,
    kills: 0,
    paused: false,
    gameOver: false
};

// Abilities system
const abilities = {
    clawOrbit: {
        name: "Claw Orbit",
        level: 1,
        maxLevel: 5,
        claws: [],
        rotation: 0,
        damage: 12,    // Reduced base damage but better scaling
        speed: 2.2,    // Slightly faster base speed
        descriptions: [
            "2 claws rotate steadily",
            "Claws rotate faster, +25% damage",
            "Adds 2 more claws (total 4)",
            "Claws grow larger, +30% damage",
            "Max speed, claws leave damaging afterimages"
        ]
    },
    whiskerWhip: {
        name: "Whisker Whip",
        level: 0,
        maxLevel: 5,
        cooldown: 0,
        maxCooldown: 120,
        damage: 25,
        range: 80,
        descriptions: [
            "Fires a whip forward every 2 seconds",
            "Cooldown reduced",
            "Whip length increased",
            "Hits pierce through multiple enemies",
            "Whip splits into two directions"
        ]
    },
    hairballBurst: {
        name: "Hairball Burst",
        level: 0,
        maxLevel: 5,
        cooldown: 0,
        maxCooldown: 180,
        damage: 20,
        count: 1,
        descriptions: [
            "Fires one hairball in random direction",
            "Damage increased",
            "+1 extra hairball",
            "Hairballs bounce once after hitting",
            "Hairballs explode into fragments"
        ]
    },
    pawSlam: {
        name: "Paw Slam",
        level: 0,
        maxLevel: 5,
        cooldown: 0,
        maxCooldown: 150,
        damage: 30,
        radius: 60,
        descriptions: [
            "Small AoE slam around the cat",
            "Damage +20%",
            "Larger radius",
            "Leaves burning paw print",
            "Double slam (hits twice)"
        ]
    },
    catNap: {
        name: "Cat Nap",
        level: 0,
        maxLevel: 5,
        cooldown: 0,
        maxCooldown: 1800,
        healing: 20,
        descriptions: [
            "Recover small HP after 30 sec",
            "Also reduces damage taken by 5%",
            "Heal amount increased",
            "Gain brief invulnerability after napping",
            "Auto-heal every 20 sec"
        ]
    }
};

// Game objects arrays
let enemies = [];
let projectiles = [];
let xpOrbs = [];
let particles = [];

// Enemy types with reduced base stats
const enemyTypes = {
    mouse: {
        name: "Street Mouse",
        hp: 12,        // Further reduced for easier early game
        speed: 0.7,    // Slightly slower for better control
        damage: 2,     // Reduced for less punishing early game
        color: "#8B4513",
        size: 8,
        xpValue: 2     // Increased for better progression
    },
    dog: {
        name: "Stray Dog",
        hp: 30,        // Slightly increased for mid-game challenge
        speed: 1.5,    // Reduced for better dodging opportunity
        damage: 6,     // Slightly reduced
        color: "#654321",
        size: 12,
        xpValue: 4     // Increased for better progression
    },
    crow: {
        name: "Cursed Crow",
        hp: 40,        // Increased to make it a proper late-game enemy
        speed: 1.2,    // Slightly reduced
        damage: 5,     // Reduced but still threatening
        color: "#2F2F2F",
        size: 10,
        xpValue: 6     // Increased for better progression
    }
};

// Input handling
const keys = {};
document.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

// Initialize default claw orbit
function initClawOrbit() {
    abilities.clawOrbit.claws = [];
    const clawCount = abilities.clawOrbit.level >= 3 ? 4 : 2;
    for (let i = 0; i < clawCount; i++) {
        abilities.clawOrbit.claws.push({
            angle: (Math.PI * 2 / clawCount) * i,
            distance: 40
        });
    }
}

// Update player movement
function updatePlayer() {
    if (keys['w'] || keys['arrowup']) gameState.player.y -= gameState.player.speed;
    if (keys['s'] || keys['arrowdown']) gameState.player.y += gameState.player.speed;
    if (keys['a'] || keys['arrowleft']) gameState.player.x -= gameState.player.speed;
    if (keys['d'] || keys['arrowright']) gameState.player.x += gameState.player.speed;

    // Keep player in bounds
    gameState.player.x = Math.max(20, Math.min(canvas.width - 20, gameState.player.x));
    gameState.player.y = Math.max(20, Math.min(canvas.height - 20, gameState.player.y));
}

// Update abilities
function updateAbilities() {
    // Claw Orbit
    if (abilities.clawOrbit.level > 0) {
        const speedMultiplier = abilities.clawOrbit.level >= 2 ? 2 : 1;
        const finalSpeed = abilities.clawOrbit.level >= 5 ? 4 : speedMultiplier;
        abilities.clawOrbit.rotation += abilities.clawOrbit.speed * finalSpeed * 0.02;

        abilities.clawOrbit.claws.forEach(claw => {
            const x = gameState.player.x + Math.cos(abilities.clawOrbit.rotation + claw.angle) * claw.distance;
            const y = gameState.player.y + Math.sin(abilities.clawOrbit.rotation + claw.angle) * claw.distance;
            claw.x = x;
            claw.y = y;
        });
    }

    // Update other ability cooldowns
    Object.values(abilities).forEach(ability => {
        if (ability.cooldown > 0) ability.cooldown--;
    });

    // Whisker Whip
    if (abilities.whiskerWhip.level > 0 && abilities.whiskerWhip.cooldown <= 0) {
        fireWhiskerWhip();
        let cooldown = abilities.whiskerWhip.maxCooldown;
        if (abilities.whiskerWhip.level >= 2) cooldown *= 0.7;
        abilities.whiskerWhip.cooldown = cooldown;
    }

    // Hairball Burst
    if (abilities.hairballBurst.level > 0 && abilities.hairballBurst.cooldown <= 0) {
        fireHairball();
        abilities.hairballBurst.cooldown = abilities.hairballBurst.maxCooldown;
    }

    // Paw Slam
    if (abilities.pawSlam.level > 0 && abilities.pawSlam.cooldown <= 0) {
        pawSlam();
        abilities.pawSlam.cooldown = abilities.pawSlam.maxCooldown;
    }

    // Cat Nap
    if (abilities.catNap.level > 0 && abilities.catNap.cooldown <= 0) {
        catNap();
        let cooldown = abilities.catNap.maxCooldown;
        if (abilities.catNap.level >= 5) cooldown = 1200; // 20 seconds
        abilities.catNap.cooldown = cooldown;
    }
}

// Ability functions
function fireWhiskerWhip() {
    const directions = abilities.whiskerWhip.level >= 5 ? [0, Math.PI] : [0];
    directions.forEach(dir => {
        projectiles.push({
            x: gameState.player.x,
            y: gameState.player.y,
            dx: Math.cos(dir) * 4,
            dy: Math.sin(dir) * 4,
            damage: abilities.whiskerWhip.damage,
            range: abilities.whiskerWhip.level >= 3 ? 120 : 80,
            pierce: abilities.whiskerWhip.level >= 4,
            type: 'whip',
            life: 0
        });
    });
}

function fireHairball() {
    const count = abilities.hairballBurst.level >= 3 ? 2 : 1;
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        let damage = abilities.hairballBurst.damage;
        if (abilities.hairballBurst.level >= 2) damage *= 1.5;
        
        projectiles.push({
            x: gameState.player.x,
            y: gameState.player.y,
            dx: Math.cos(angle) * 3,
            dy: Math.sin(angle) * 3,
            damage: damage,
            bounce: abilities.hairballBurst.level >= 4,
            explode: abilities.hairballBurst.level >= 5,
            type: 'hairball',
            life: 0
        });
    }
}

function pawSlam() {
    let radius = abilities.pawSlam.radius;
    if (abilities.pawSlam.level >= 3) radius *= 1.5;
    let damage = abilities.pawSlam.damage;
    if (abilities.pawSlam.level >= 2) damage *= 1.2;

    enemies.forEach(enemy => {
        const dist = Math.hypot(enemy.x - gameState.player.x, enemy.y - gameState.player.y);
        if (dist <= radius) {
            enemy.hp -= damage;
            if (abilities.pawSlam.level >= 5) {
                setTimeout(() => {
                    enemy.hp -= damage * 0.5; // Second hit
                }, 200);
            }
        }
    });

    // Visual effect
    particles.push({
        x: gameState.player.x,
        y: gameState.player.y,
        radius: radius,
        life: 30,
        type: 'slam'
    });
}

function catNap() {
    let healing = abilities.catNap.healing;
    if (abilities.catNap.level >= 3) healing *= 1.5; // Reduced multiplier since HP is capped
    
    gameState.player.hp = Math.min(100, gameState.player.hp + healing);
    
    if (abilities.catNap.level >= 4) {
        // Brief invulnerability (implement damage reduction logic)
        gameState.player.invulnerable = 180; // 3 seconds
    }
}

// Enemy spawning with progressive difficulty and capping
function spawnEnemies() {
    // Enemy count cap based on time and level
    const baseEnemyCap = 15;
    const timeCap = Math.floor(gameState.time / 1800) * 5; // +5 every 30 seconds
    const levelCap = Math.floor(gameState.player.level / 3) * 3; // +3 every 3 levels
    const maxEnemies = Math.min(baseEnemyCap + timeCap + levelCap, 50); // Absolute cap of 50
    
    // Don't spawn if we're at cap
    if (enemies.length >= maxEnemies) return;
    
    // Difficulty waves every 25 seconds (1500 frames)
    const waveNumber = Math.floor(gameState.time / 1500) + 1;
    const currentWaveTime = gameState.time % 1500;
    
    // Increased spawn rate during first 10 seconds of each wave
    const isWaveStart = currentWaveTime < 600; // First 10 seconds
    const waveMultiplier = isWaveStart ? 2.0 : 1.0;
    
    // Base spawn rate with wave scaling
    const baseSpawnRate = 0.008; // Slightly higher base rate
    const waveScaling = Math.min(waveNumber * 0.002, 0.015); // Caps at reasonable rate
    const levelMultiplier = Math.min(gameState.player.level * 0.002, 0.020);
    
    const finalSpawnRate = (baseSpawnRate + waveScaling + levelMultiplier) * waveMultiplier;
    
    if (Math.random() < finalSpawnRate) {
        // Enemy type selection based on wave and level
        let selectedType = 'mouse';
        
        // Wave-based enemy progression
        const dogUnlockWave = 2; // Dogs appear from wave 2 (25 seconds)
        const crowUnlockWave = 4; // Crows appear from wave 4 (75 seconds)
        
        if (waveNumber >= crowUnlockWave && gameState.player.level >= 5) {
            // Late game: varied enemy types
            const rand = Math.random();
            if (rand < 0.4) selectedType = 'mouse';
            else if (rand < 0.7) selectedType = 'dog';
            else selectedType = 'crow';
        } else if (waveNumber >= dogUnlockWave && gameState.player.level >= 2) {
            // Mid game: mice and dogs
            const rand = Math.random();
            if (rand < 0.6) selectedType = 'mouse';
            else selectedType = 'dog';
        } else {
            // Early game: mostly mice
            selectedType = 'mouse';
        }

        const enemyTemplate = enemyTypes[selectedType];
        
        // Scale enemy stats with waves and level
        const waveScaling = 1 + (waveNumber - 1) * 0.12; // 12% increase per wave
        const levelScaling = 1 + (gameState.player.level - 1) * 0.05; // 5% increase per level
        const totalScaling = waveScaling * levelScaling;
        
        // Spawn position
        const side = Math.floor(Math.random() * 4);
        let x, y;

        switch (side) {
            case 0: x = Math.random() * canvas.width; y = -20; break;
            case 1: x = canvas.width + 20; y = Math.random() * canvas.height; break;
            case 2: x = Math.random() * canvas.width; y = canvas.height + 20; break;
            case 3: x = -20; y = Math.random() * canvas.height; break;
        }

        enemies.push({
            x: x,
            y: y,
            hp: Math.floor(enemyTemplate.hp * totalScaling),
            maxHp: Math.floor(enemyTemplate.hp * totalScaling),
            speed: enemyTemplate.speed * Math.min(totalScaling, 2.5), // Cap speed scaling
            damage: Math.floor(enemyTemplate.damage * totalScaling),
            color: enemyTemplate.color,
            size: enemyTemplate.size,
            xpValue: Math.floor(enemyTemplate.xpValue * Math.max(totalScaling, 1.2)),
            type: selectedType,
            wave: waveNumber
        });
    }
}

// Update enemies
function updateEnemies() {
    enemies.forEach((enemy, index) => {
        // Move towards player
        const dx = gameState.player.x - enemy.x;
        const dy = gameState.player.y - enemy.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0) {
            enemy.x += (dx / dist) * enemy.speed;
            enemy.y += (dy / dist) * enemy.speed;
        }

        // Check collision with player
        if (dist < enemy.size + 15) {
            if (!gameState.player.invulnerable || gameState.player.invulnerable <= 0) {
                // Reduce damage taken and add brief invulnerability after hit
                const damageReduction = abilities.catNap.level >= 2 ? 0.95 : 1;
                const finalDamage = Math.max(1, Math.floor(enemy.damage * damageReduction));
                gameState.player.hp -= finalDamage;
                
                // Brief invulnerability after taking damage (60 frames = 1 second)
                gameState.player.invulnerable = 60;
                
                // Remove the enemy after it hits the player
                enemies.splice(index, 1);
                
                if (gameState.player.hp <= 0) {
                    gameOver();
                }
            }
        }

        // Check collision with claws
        if (abilities.clawOrbit.level > 0) {
            abilities.clawOrbit.claws.forEach(claw => {
                const clawDist = Math.hypot(claw.x - enemy.x, claw.y - enemy.y);
                const clawSize = abilities.clawOrbit.level >= 4 ? 12 : 8;
                if (clawDist < clawSize + enemy.size) {
                    let damage = abilities.clawOrbit.damage;
                    // Progressive damage scaling
                    if (abilities.clawOrbit.level >= 2) damage *= 1.25;  // Level 2: +25%
                    if (abilities.clawOrbit.level >= 4) damage *= 1.3;   // Level 4: +30% more
                    if (abilities.clawOrbit.level >= 5) {
                        // Afterimages deal 40% of base damage
                        const afterimageDamage = Math.floor(abilities.clawOrbit.damage * 0.4);
                        setTimeout(() => {
                            enemy.hp -= afterimageDamage;
                        }, 150);
                    }
                    enemy.hp -= damage;
                }
            });
        }

        // Remove dead enemies
        if (enemy.hp <= 0) {
            dropXP(enemy.x, enemy.y, enemy.xpValue);
            enemies.splice(index, 1);
            gameState.kills++;
        }
    });

    // Update invulnerability
    if (gameState.player.invulnerable > 0) {
        gameState.player.invulnerable--;
    }
}

// Update projectiles
function updateProjectiles() {
    projectiles.forEach((proj, projIndex) => {
        proj.x += proj.dx;
        proj.y += proj.dy;
        proj.life++;

        // Check collision with enemies
        enemies.forEach((enemy, enemyIndex) => {
            const dist = Math.hypot(proj.x - enemy.x, proj.y - enemy.y);
            if (dist < enemy.size + 5) {
                enemy.hp -= proj.damage;
                
                if (!proj.pierce) {
                    projectiles.splice(projIndex, 1);
                }
            }
        });

        // Remove projectiles that are too far
        if (proj.x < -50 || proj.x > canvas.width + 50 || 
            proj.y < -50 || proj.y > canvas.height + 50 ||
            proj.life > proj.range) {
            projectiles.splice(projIndex, 1);
        }
    });
}

// XP system with 50% drop chance
function dropXP(x, y, value) {
    // 50% chance to drop XP
    if (Math.random() < 0.5) {
        xpOrbs.push({
            x: x,
            y: y,
            value: value,
            life: 600 // 10 seconds
        });
    }
}

function updateXP() {
    xpOrbs.forEach((orb, index) => {
        // Move towards player if close
        const dist = Math.hypot(orb.x - gameState.player.x, orb.y - gameState.player.y);
        if (dist < 30) {
            const dx = gameState.player.x - orb.x;
            const dy = gameState.player.y - orb.y;
            orb.x += dx * 0.1;
            orb.y += dy * 0.1;
        }

        // Collect XP
        if (dist < 20) {
            gameState.player.xp += orb.value;
            xpOrbs.splice(index, 1);
            
            // Level up check
            if (gameState.player.xp >= gameState.player.xpNext) {
                levelUp();
            }
        }

        orb.life--;
        if (orb.life <= 0) {
            xpOrbs.splice(index, 1);
        }
    });
}

// Level up system with scaled XP requirements
function levelUp() {
    gameState.player.level++;
    gameState.player.xp -= gameState.player.xpNext;
    
    // More generous early game scaling, steeper late game
    if (gameState.player.level <= 5) {
        gameState.player.xpNext = Math.floor(gameState.player.xpNext * 1.12); // 12% increase early game
    } else if (gameState.player.level <= 10) {
        gameState.player.xpNext = Math.floor(gameState.player.xpNext * 1.15); // 15% increase mid game
    } else {
        gameState.player.xpNext = Math.floor(gameState.player.xpNext * 1.18); // 18% increase late game
    }
    
    // Fixed HP cap at 100
    gameState.player.maxHp = 100; // Keep max HP fixed at 100
    gameState.player.hp = Math.min(100, gameState.player.hp + 20); // Heal 20 HP on level up
    
    showLevelUpModal();
}

function showLevelUpModal() {
    gameState.paused = true;
    const modal = document.getElementById('levelUpModal');
    const choicesDiv = document.getElementById('upgradeChoices');
    choicesDiv.innerHTML = '';

    // Get available upgrades
    const availableUpgrades = [];
    Object.entries(abilities).forEach(([key, ability]) => {
        if (ability.level < ability.maxLevel) {
            availableUpgrades.push({
                key: key,
                name: ability.name,
                description: ability.descriptions[ability.level],
                isNew: ability.level === 0
            });
        }
    });

    // Randomly select 2 upgrades
    const selectedUpgrades = [];
    while (selectedUpgrades.length < 2 && availableUpgrades.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableUpgrades.length);
        selectedUpgrades.push(availableUpgrades[randomIndex]);
        availableUpgrades.splice(randomIndex, 1);
    }

    selectedUpgrades.forEach(upgrade => {
        const button = document.createElement('button');
        button.className = 'upgrade-choice';
        button.innerHTML = `
            <strong>${upgrade.name} ${upgrade.isNew ? '(NEW!)' : 'Lv' + (abilities[upgrade.key].level + 1)}</strong><br>
            ${upgrade.description}
        `;
        button.onclick = () => selectUpgrade(upgrade.key);
        choicesDiv.appendChild(button);
    });

    modal.style.display = 'block';
}

function selectUpgrade(abilityKey) {
    abilities[abilityKey].level++;
    
    // Special handling for claw orbit
    if (abilityKey === 'clawOrbit') {
        initClawOrbit();
    }

    document.getElementById('levelUpModal').style.display = 'none';
    gameState.paused = false;
}

// Update particles
function updateParticles() {
    particles.forEach((particle, index) => {
        particle.life--;
        if (particle.life <= 0) {
            particles.splice(index, 1);
        }
    });
}

// Rendering functions
function render() {
    ctx.fillStyle = 'rgba(26, 26, 46, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw player (cat)
    ctx.fillStyle = gameState.player.invulnerable > 0 ? 'rgba(255, 165, 0, 0.5)' : '#FFA500';
    ctx.beginPath();
    ctx.arc(gameState.player.x, gameState.player.y, 15, 0, Math.PI * 2);
    ctx.fill();

    // Draw cat ears
    ctx.fillStyle = '#FF8C00';
    ctx.beginPath();
    ctx.moveTo(gameState.player.x - 8, gameState.player.y - 10);
    ctx.lineTo(gameState.player.x - 15, gameState.player.y - 20);
    ctx.lineTo(gameState.player.x - 5, gameState.player.y - 15);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(gameState.player.x + 8, gameState.player.y - 10);
    ctx.lineTo(gameState.player.x + 15, gameState.player.y - 20);
    ctx.lineTo(gameState.player.x + 5, gameState.player.y - 15);
    ctx.fill();

    // Draw claws
    if (abilities.clawOrbit.level > 0) {
        abilities.clawOrbit.claws.forEach(claw => {
            const size = abilities.clawOrbit.level >= 4 ? 12 : 8;
            ctx.fillStyle = '#FF4444';
            ctx.beginPath();
            ctx.arc(claw.x, claw.y, size, 0, Math.PI * 2);
            ctx.fill();

            // Afterimages for level 5
            if (abilities.clawOrbit.level >= 5) {
                ctx.fillStyle = 'rgba(255, 68, 68, 0.3)';
                const prevX = gameState.player.x + Math.cos(abilities.clawOrbit.rotation + claw.angle - 0.2) * claw.distance;
                const prevY = gameState.player.y + Math.sin(abilities.clawOrbit.rotation + claw.angle - 0.2) * claw.distance;
                ctx.beginPath();
                ctx.arc(prevX, prevY, size, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    // Draw enemies
    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
        ctx.fill();

        // HP bar
        if (enemy.hp < enemy.maxHp) {
            ctx.fillStyle = 'red';
            ctx.fillRect(enemy.x - enemy.size, enemy.y - enemy.size - 10, enemy.size * 2, 3);
            ctx.fillStyle = 'green';
            ctx.fillRect(enemy.x - enemy.size, enemy.y - enemy.size - 10, (enemy.hp / enemy.maxHp) * enemy.size * 2, 3);
        }
    });

    // Draw projectiles
    projectiles.forEach(proj => {
        ctx.fillStyle = proj.type === 'whip' ? '#9966CC' : '#8B4513';
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, 4, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw XP orbs
    xpOrbs.forEach(orb => {
        ctx.fillStyle = '#00FF00';
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, 5, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw particles
    particles.forEach(particle => {
        if (particle.type === 'slam') {
            ctx.strokeStyle = `rgba(255, 165, 0, ${particle.life / 30})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.stroke();
        }
    });
}

function updateUI() {
    // Update HP bar
    const hpPercentage = Math.max(0, gameState.player.hp) / gameState.player.maxHp * 100;
    document.getElementById('hpBar').style.width = hpPercentage + '%';
    document.getElementById('hpText').textContent = `${Math.max(0, gameState.player.hp)}/${gameState.player.maxHp}`;
    
    // Update XP bar
    const xpPercentage = gameState.player.xp / gameState.player.xpNext * 100;
    document.getElementById('xpBar').style.width = xpPercentage + '%';
    document.getElementById('xpText').textContent = `${gameState.player.xp}/${gameState.player.xpNext}`;
    
    // Calculate wave and enemy cap info
    const currentWave = Math.floor(gameState.time / 1500) + 1;
    const baseEnemyCap = 15;
    const timeCap = Math.floor(gameState.time / 1800) * 5;
    const levelCap = Math.floor(gameState.player.level / 3) * 3;
    const maxEnemies = Math.min(baseEnemyCap + timeCap + levelCap, 50);
    
    // Update stats
    document.getElementById('level').textContent = gameState.player.level;
    document.getElementById('time').textContent = Math.floor(gameState.time / 60);
    document.getElementById('wave').textContent = currentWave;
    document.getElementById('kills').textContent = gameState.kills;
    document.getElementById('enemyCount').textContent = enemies.length;
    document.getElementById('enemyCap').textContent = maxEnemies;
}

function gameOver() {
    gameState.gameOver = true;
    const finalScore = gameState.kills;
    const currentHighScore = localStorage.getItem('catto_highscore') || 0;
    
    if (finalScore > currentHighScore) {
        localStorage.setItem('catto_highscore', finalScore);
    }
    
    document.getElementById('finalScore').textContent = finalScore;
    document.getElementById('highScore').textContent = Math.max(currentHighScore, finalScore);
    document.getElementById('finalTime').textContent = Math.floor(gameState.time / 60);
    document.getElementById('gameOver').style.display = 'block';
}

function startGame() {
    // Reset game state
    gameState = {
        player: {
            x: 400,
            y: 300,
            hp: 100,
            maxHp: 100,
            level: 1,
            xp: 0,
            xpNext: 10,
            speed: 3
        },
        time: 0,
        kills: 0,
        paused: false,
        gameOver: false
    };

    // Reset abilities
    Object.values(abilities).forEach(ability => {
        ability.level = ability.name === 'Claw Orbit' ? 1 : 0;
        ability.cooldown = 0;
    });

    // Clear arrays
    enemies.length = 0;
    projectiles.length = 0;
    xpOrbs.length = 0;
    particles.length = 0;

    // Initialize claw orbit
    initClawOrbit();

    // Hide modals
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('levelUpModal').style.display = 'none';

    gameLoop();
}

function gameLoop() {
    if (gameState.gameOver) return;

    if (!gameState.paused) {
        gameState.time++;
        updatePlayer();
        updateAbilities();
        spawnEnemies();
        updateEnemies();
        updateProjectiles();
        updateXP();
        updateParticles();
    }

    render();
    updateUI();
    requestAnimationFrame(gameLoop);
}

// Start the game
startGame();