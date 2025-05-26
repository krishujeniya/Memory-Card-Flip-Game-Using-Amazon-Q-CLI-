document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const gameBoard = document.getElementById('game-board');
    const startButton = document.getElementById('start');
    const movesDisplay = document.getElementById('moves');
    const timerDisplay = document.getElementById('timer');
    const levelDisplay = document.getElementById('level');
    const difficultySelect = document.getElementById('difficulty');
    const themeSelect = document.getElementById('theme');
    const modeSelect = document.getElementById('game-mode');
    const storyPanel = document.getElementById('story-panel');
    const storyText = document.getElementById('story-text');
    const continueBtn = document.getElementById('continue-btn');
    const progressFill = document.querySelector('.progress-fill');
    
    // Audio elements
    const backgroundMusic = document.getElementById('background-music');
    const matchSound = document.getElementById('match-sound');
    const wrongSound = document.getElementById('wrong-sound');
    const specialSound = document.getElementById('special-sound');
    const levelCompleteSound = document.getElementById('level-complete');
    
    // Game state variables
    let cards = [];
    let hasFlippedCard = false;
    let lockBoard = false;
    let firstCard, secondCard;
    let moves = 0;
    let matches = 0;
    let timer = 60;
    let timerInterval;
    let currentLevel = 1;
    let currentDifficulty = 'medium';
    let currentTheme = 'ice';
    let currentMode = 'story';
    let timerPaused = false;
    let bossCardTimer = null;
    let bossCard = null;
    
    // Theme-specific card sets
    const themeCards = {
        forest: [
            '🌳', '🌲', '🍄', '🦊', '🦌', '🐿️', '🦉', '🐺',
            '🍃', '🌿', '🌱', '🌷', '🌻', '🦋', '🐝', '🐞',
            '🍎', '🍓', '🍒', '🍇', '🐢', '🦎', '🐍', '🐸'
        ],
        ice: [
            '❄️', '☃️', '⛄', '🧊', '🏔️', '🐧', '🐻‍❄️', '🦭',
            '🌨️', '🥶', '🧤', '🧣', '⛸️', '🏂', '🎿', '🛷',
            '🥌', '🧩', '🧪', '🧫', '🧬', '🔬', '🔭', '📡'
        ],
        desert: [
            '🏜️', '🌵', '🦂', '🦎', '🐪', '🐫', '🦙', '🦘',
            '☀️', '🔥', '🌡️', '🧯', '🏺', '⏳', '🧭', '🗿',
            '🏛️', '🏯', '🏰', '⚱️', '💎', '🔮', '🧿', '📜'
        ],
        tech: [
            '💻', '🖥️', '📱', '⌨️', '🖱️', '🖨️', '📷', '📹',
            '🎮', '🕹️', '🎧', '🔋', '💾', '💿', '📀', '🧮',
            '🔌', '📡', '📺', '📻', '📟', '🔍', '🔎', '🧲'
        ]
    };
    
    // Special cards
    const specialCards = {
        fire: {
            symbol: '🔥',
            effect: 'Burns a wrong pair off the board'
        },
        ice: {
            symbol: '🧊',
            effect: 'Freezes timer for 10 seconds'
        },
        lightning: {
            symbol: '⚡',
            effect: 'Flips a row for 2 seconds'
        }
    };
    
    // Story mode dialogues
    const storyDialogues = [
        "Welcome, brave adventurer! I am Wizard Memorius. My magical runes have been scattered across the realms. Help me recover them by matching the pairs!",
        "Excellent work! You've recovered the first set of runes. Now we must venture into deeper magic. The next set will be more challenging!",
        "Impressive memory skills! You're a natural at this magic. But beware, the next level contains special cards with unique powers!",
        "We're getting closer to restoring my power! The next realm contains cards possessed by dark magic. Match them quickly before they cause trouble!",
        "You've proven yourself worthy! This final challenge will test all your skills. Complete it, and my powers will be fully restored!"
    ];
    
    // Initialize game
    function initGame() {
        clearInterval(timerInterval);
        gameBoard.innerHTML = '';
        cards = [];
        hasFlippedCard = false;
        lockBoard = false;
        firstCard = null;
        secondCard = null;
        moves = 0;
        matches = 0;
        
        // Get current settings
        currentDifficulty = difficultySelect.value;
        currentTheme = themeSelect.value;
        currentMode = modeSelect.value;
        
        // Update UI
        movesDisplay.textContent = '0 Moves';
        updateThemeColors();
        
        // Set up grid based on difficulty and level
        setupGrid();
        
        // Create and shuffle cards
        createCards();
        
        // Show story panel if in story mode
        if (currentMode === 'story') {
            showStoryPanel();
        } else {
            startGameplay();
        }
    }
    
    // Update theme colors
    function updateThemeColors() {
        document.documentElement.style.setProperty('--current-primary', `var(--${currentTheme}-primary)`);
        document.documentElement.style.setProperty('--current-secondary', `var(--${currentTheme}-secondary)`);
        document.documentElement.style.setProperty('--current-accent', `var(--${currentTheme}-accent)`);
    }
    
    // Set up grid based on difficulty and level
    function setupGrid() {
        let gridSize;
        
        switch (currentDifficulty) {
            case 'easy':
                gridSize = currentLevel === 1 ? 4 : (currentLevel === 2 ? 4 : 6);
                break;
            case 'medium':
                gridSize = currentLevel === 1 ? 6 : (currentLevel === 2 ? 6 : 8);
                break;
            case 'hard':
                gridSize = currentLevel === 1 ? 6 : (currentLevel === 2 ? 8 : 8);
                break;
            default:
                gridSize = 4;
        }
        
        gameBoard.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
        
        // Adjust card height based on grid size
        const cardHeight = gridSize <= 6 ? 120 : 100;
        document.documentElement.style.setProperty('--card-height', `${cardHeight}px`);
    }
    
    // Create cards
    function createCards() {
        const themeSymbols = themeCards[currentTheme];
        let gridSize;
        
        switch (currentDifficulty) {
            case 'easy':
                gridSize = currentLevel === 1 ? 16 : (currentLevel === 2 ? 16 : 36);
                break;
            case 'medium':
                gridSize = currentLevel === 1 ? 36 : (currentLevel === 2 ? 36 : 64);
                break;
            case 'hard':
                gridSize = currentLevel === 1 ? 36 : (currentLevel === 2 ? 64 : 64);
                break;
            default:
                gridSize = 16;
        }
        
        // Calculate how many pairs we need
        const pairsNeeded = gridSize / 2;
        
        // Get symbols for this level
        let levelSymbols = themeSymbols.slice(0, pairsNeeded);
        
        // If we need more symbols than available, repeat some
        while (levelSymbols.length < pairsNeeded) {
            levelSymbols.push(themeSymbols[levelSymbols.length % themeSymbols.length]);
        }
        
        // Create pairs
        let cardPairs = [];
        levelSymbols.forEach(symbol => {
            cardPairs.push({ symbol, type: 'normal' });
            cardPairs.push({ symbol, type: 'normal' });
        });
        
        // Add special cards based on level
        if (currentLevel >= 2) {
            // Replace some pairs with special cards
            const specialTypes = Object.keys(specialCards);
            const specialCount = Math.min(currentLevel, specialTypes.length);
            
            for (let i = 0; i < specialCount; i++) {
                const specialType = specialTypes[i];
                const specialSymbol = specialCards[specialType].symbol;
                
                // Replace a random pair with a special pair
                const randomIndex = Math.floor(Math.random() * (cardPairs.length / 2));
                cardPairs[randomIndex * 2] = { symbol: specialSymbol, type: specialType };
                cardPairs[randomIndex * 2 + 1] = { symbol: specialSymbol, type: specialType };
            }
        }
        
        // Add boss card in level 3+
        if (currentLevel >= 3 && currentMode === 'story') {
            const bossSymbol = '🧌';
            const randomIndex = Math.floor(Math.random() * (cardPairs.length / 2));
            cardPairs[randomIndex * 2] = { symbol: bossSymbol, type: 'boss' };
            cardPairs[randomIndex * 2 + 1] = { symbol: bossSymbol, type: 'boss' };
        }
        
        // Shuffle cards
        const shuffledCards = shuffle(cardPairs);
        
        // Create card elements
        shuffledCards.forEach((card, index) => {
            const cardElement = createCardElement(card, index);
            gameBoard.appendChild(cardElement);
            cards.push(cardElement);
        });
    }
    
    // Create a card element
    function createCardElement(card, index) {
        const cardElement = document.createElement('div');
        cardElement.classList.add('card');
        cardElement.dataset.index = index;
        cardElement.dataset.symbol = card.symbol;
        cardElement.dataset.type = card.type;
        
        const cardFront = document.createElement('div');
        cardFront.classList.add('card-face', 'card-front');
        cardFront.textContent = card.symbol;
        
        // Add special class for special cards
        if (card.type !== 'normal') {
            cardElement.classList.add(card.type);
        }
        
        // Add boss timer if it's a boss card
        if (card.type === 'boss') {
            const bossTimer = document.createElement('div');
            bossTimer.classList.add('boss-timer');
            bossTimer.textContent = '15';
            cardFront.appendChild(bossTimer);
        }
        
        const cardBack = document.createElement('div');
        cardBack.classList.add('card-face', 'card-back');
        
        cardElement.appendChild(cardFront);
        cardElement.appendChild(cardBack);
        
        cardElement.addEventListener('click', flipCard);
        
        return cardElement;
    }
    
    // Show story panel
    function showStoryPanel() {
        storyText.textContent = storyDialogues[currentLevel - 1] || storyDialogues[0];
        storyPanel.classList.remove('hidden');
    }
    
    // Start gameplay
    function startGameplay() {
        // Set timer based on mode and level
        if (currentMode === 'timed' || currentMode === 'story') {
            timer = 60 + (currentLevel * 15);
            timerDisplay.textContent = `Time: ${timer}s`;
            
            timerInterval = setInterval(() => {
                if (!timerPaused) {
                    timer--;
                    timerDisplay.textContent = `Time: ${timer}s`;
                    
                    // Update progress bar
                    const maxTime = 60 + (currentLevel * 15);
                    const percentage = (timer / maxTime) * 100;
                    progressFill.style.width = `${percentage}%`;
                    
                    // Warning when time is low
                    if (timer <= 10) {
                        timerDisplay.classList.add('timer-warning');
                    } else {
                        timerDisplay.classList.remove('timer-warning');
                    }
                    
                    // Game over when time runs out
                    if (timer <= 0) {
                        clearInterval(timerInterval);
                        alert('Time\'s up! Game over.');
                        resetGame();
                    }
                }
            }, 1000);
        } else {
            timerDisplay.textContent = 'Time: --';
        }
        
        // Start background music
        if (backgroundMusic) {
            backgroundMusic.volume = 0.3;
            backgroundMusic.play().catch(e => console.log('Audio play failed:', e));
        }
    }
    
    // Flip card function
    function flipCard() {
        if (lockBoard) return;
        if (this === firstCard) return;
        
        this.classList.add('flipped');
        
        // Play flip sound
        playSound('match');
        
        if (!hasFlippedCard) {
            // First card flipped
            hasFlippedCard = true;
            firstCard = this;
            
            // Start boss timer if it's a boss card
            if (firstCard.dataset.type === 'boss') {
                startBossTimer(firstCard);
            }
            
            return;
        }
        
        // Second card flipped
        secondCard = this;
        moves++;
        movesDisplay.textContent = `${moves} Moves`;
        
        checkForMatch();
    }
    
    // Start boss timer
    function startBossTimer(card) {
        bossCard = card;
        let bossTime = 15;
        const bossTimerElement = card.querySelector('.boss-timer');
        
        bossCardTimer = setInterval(() => {
            bossTime--;
            if (bossTimerElement) {
                bossTimerElement.textContent = bossTime;
            }
            
            if (bossTime <= 0) {
                clearInterval(bossCardTimer);
                // Boss card effect: reset a row
                resetRandomRow();
                card.classList.remove('flipped');
                hasFlippedCard = false;
                firstCard = null;
            }
        }, 1000);
    }
    
    // Reset a random row
    function resetRandomRow() {
        const gridSize = Math.sqrt(cards.length);
        const randomRow = Math.floor(Math.random() * gridSize);
        const startIndex = randomRow * gridSize;
        
        for (let i = 0; i < gridSize; i++) {
            const cardIndex = startIndex + i;
            if (cardIndex < cards.length) {
                const card = cards[cardIndex];
                if (card.classList.contains('flipped') && !card.classList.contains('matched')) {
                    card.classList.remove('flipped');
                }
            }
        }
        
        playSound('wrong');
    }
    
    // Check if cards match
    function checkForMatch() {
        const isMatch = firstCard.dataset.symbol === secondCard.dataset.symbol;
        
        if (isMatch) {
            disableCards();
            matches++;
            
            // Play match sound
            playSound('match');
            
            // Handle special card effects
            if (firstCard.dataset.type !== 'normal') {
                handleSpecialCardEffect(firstCard.dataset.type);
            }
            
            // Clear boss timer if it was a boss card
            if (firstCard.dataset.type === 'boss') {
                clearInterval(bossCardTimer);
                bossCard = null;
            }
            
            // Update progress
            const totalPairs = cards.length / 2;
            const percentage = (matches / totalPairs) * 100;
            progressFill.style.width = `${percentage}%`;
            
            // Check if level is complete
            if (matches === totalPairs) {
                handleLevelComplete();
            }
        } else {
            unflipCards();
            playSound('wrong');
        }
    }
    
    // Handle special card effect
    function handleSpecialCardEffect(type) {
        playSound('special');
        
        switch (type) {
            case 'fire':
                // Burn a random unmatched pair
                burnRandomPair();
                break;
            case 'ice':
                // Freeze timer for 10 seconds
                freezeTimer();
                break;
            case 'lightning':
                // Reveal a row for 2 seconds
                revealRow();
                break;
        }
    }
    
    // Burn a random unmatched pair
    function burnRandomPair() {
        const unmatchedCards = cards.filter(card => 
            !card.classList.contains('matched') && 
            !card.classList.contains('flipped')
        );
        
        if (unmatchedCards.length >= 2) {
            const randomIndex = Math.floor(Math.random() * (unmatchedCards.length / 2));
            const symbol = unmatchedCards[randomIndex].dataset.symbol;
            
            const pairToRemove = cards.filter(card => 
                card.dataset.symbol === symbol && 
                !card.classList.contains('matched') &&
                !card.classList.contains('flipped')
            );
            
            if (pairToRemove.length === 2) {
                setTimeout(() => {
                    pairToRemove[0].classList.add('flipped', 'matched');
                    pairToRemove[1].classList.add('flipped', 'matched');
                    matches++;
                    
                    // Check if level is complete after burning
                    const totalPairs = cards.length / 2;
                    if (matches === totalPairs) {
                        handleLevelComplete();
                    }
                }, 500);
            }
        }
    }
    
    // Freeze timer for 10 seconds
    function freezeTimer() {
        timerPaused = true;
        timerDisplay.style.color = 'var(--ice-primary)';
        
        setTimeout(() => {
            timerPaused = false;
            timerDisplay.style.color = '';
        }, 10000);
    }
    
    // Reveal a row for 2 seconds
    function revealRow() {
        const gridSize = Math.sqrt(cards.length);
        const randomRow = Math.floor(Math.random() * gridSize);
        const startIndex = randomRow * gridSize;
        const revealedCards = [];
        
        for (let i = 0; i < gridSize; i++) {
            const cardIndex = startIndex + i;
            if (cardIndex < cards.length) {
                const card = cards[cardIndex];
                if (!card.classList.contains('flipped') && !card.classList.contains('matched')) {
                    card.classList.add('flipped', 'temp-revealed');
                    revealedCards.push(card);
                }
            }
        }
        
        setTimeout(() => {
            revealedCards.forEach(card => {
                card.classList.remove('flipped', 'temp-revealed');
            });
        }, 2000);
    }
    
    // Handle level complete
    function handleLevelComplete() {
        clearInterval(timerInterval);
        playSound('level-complete');
        
        setTimeout(() => {
            if (currentMode === 'story') {
                if (currentLevel < 3) {
                    currentLevel++;
                    levelDisplay.textContent = `Level: ${currentLevel}`;
                    showStoryPanel();
                } else {
                    alert(`Congratulations! You've completed all levels and restored the wizard's power!`);
                    resetGame();
                }
            } else {
                alert(`Level complete! You matched all pairs in ${moves} moves and ${60 - timer} seconds!`);
                resetGame();
            }
        }, 1000);
    }
    
    // Disable matched cards
    function disableCards() {
        firstCard.classList.add('matched');
        secondCard.classList.add('matched');
        
        firstCard.removeEventListener('click', flipCard);
        secondCard.removeEventListener('click', flipCard);
        
        resetBoard();
    }
    
    // Unflip unmatched cards
    function unflipCards() {
        lockBoard = true;
        
        setTimeout(() => {
            firstCard.classList.remove('flipped');
            secondCard.classList.remove('flipped');
            
            resetBoard();
        }, 1000);
    }
    
    // Reset board after each turn
    function resetBoard() {
        [hasFlippedCard, lockBoard] = [false, false];
        [firstCard, secondCard] = [null, null];
    }
    
    // Reset game to initial state
    function resetGame() {
        clearInterval(timerInterval);
        clearInterval(bossCardTimer);
        currentLevel = 1;
        levelDisplay.textContent = `Level: ${currentLevel}`;
        initGame();
    }
    
    // Play sound effect
    function playSound(type) {
        let sound;
        switch (type) {
            case 'match':
                sound = matchSound;
                break;
            case 'wrong':
                sound = wrongSound;
                break;
            case 'special':
                sound = specialSound;
                break;
            case 'level-complete':
                sound = levelCompleteSound;
                break;
        }
        
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => console.log('Audio play failed:', e));
        }
    }
    
    // Shuffle array (Fisher-Yates algorithm)
    function shuffle(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }
    
    // Event listeners
    startButton.addEventListener('click', initGame);
    continueBtn.addEventListener('click', () => {
        storyPanel.classList.add('hidden');
        startGameplay();
    });
    
    difficultySelect.addEventListener('change', () => {
        currentDifficulty = difficultySelect.value;
    });
    
    themeSelect.addEventListener('change', () => {
        currentTheme = themeSelect.value;
        updateThemeColors();
    });
    
    modeSelect.addEventListener('change', () => {
        currentMode = modeSelect.value;
    });
    
    // Initialize game on load
    updateThemeColors();
    initGame();
});
