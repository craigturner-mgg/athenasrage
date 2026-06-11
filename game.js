// ===== ATHENA'S RAGE - Game Simulation =====

const CONFIG = {
    reels: 5,
    rows: 4,
    totalSpinTime: 2500, // 2.5 seconds total
    reelDelay: 300, // delay between each reel landing
    symbolHeight: 90,
    stakes: [0.10, 0.20, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80, 0.90, 1.00, 1.20, 1.40, 1.50, 1.60, 1.80, 2.00, 2.50, 3.00, 3.50, 4.00, 4.50, 5.00, 6.00, 7.00, 8.00, 9.00, 10.00, 15.00, 20.00, 25.00, 30.00, 35.00, 40.00, 50.00],
    winlines: 19
};

// Symbols
const SYMBOLS = {
    J:  { id: 'Sym1',  name: 'J',  display: 'J',   class: 'sym-J' },
    Q:  { id: 'Sym2',  name: 'Q',  display: 'Q',   class: 'sym-Q' },
    K:  { id: 'Sym3',  name: 'K',  display: 'K',   class: 'sym-K' },
    A:  { id: 'Sym4',  name: 'A',  display: 'A',   class: 'sym-A' },
    M2: { id: 'Sym5',  name: 'M2', display: 'M2',  class: 'sym-M2' },
    M1: { id: 'Sym6',  name: 'M1', display: 'M1',  class: 'sym-M1' },
    H3: { id: 'Sym7',  name: 'H3', display: 'H3',  class: 'sym-H3' },
    H2: { id: 'Sym8',  name: 'H2', display: 'H2',  class: 'sym-H2' },
    H1: { id: 'Sym9',  name: 'H1', display: 'H1',  class: 'sym-H1' },
    W:  { id: 'Sym10', name: 'W',  display: 'WILD', class: 'sym-W' },
    SC: { id: 'Sym11', name: 'SC', display: 'SC',  class: 'sym-SC' }
};

// Paytable: symbol -> [2x, 3x, 4x, 5x] (0 means no pay)
const PAYTABLE = {
    J:  [0, 0.1, 0.3, 1],
    Q:  [0, 0.1, 0.3, 1],
    K:  [0, 0.2, 0.5, 2],
    A:  [0, 0.2, 0.5, 2],
    M2: [0, 0.5, 1, 4],
    M1: [0, 0.5, 1, 4],
    H3: [0, 1, 2, 6],
    H2: [0, 1.5, 3, 8],
    H1: [1, 3, 5, 10],
    W:  [0, 0, 0, 10]
};

// 19 Winlines (0-indexed rows, each array is [row on reel0, row on reel1, ... row on reel4])
const WINLINES = [
    [1, 1, 1, 1, 1], // line 1 - middle
    [0, 0, 0, 0, 0], // line 2 - top
    [2, 2, 2, 2, 2], // line 3 - bottom row 3
    [3, 3, 3, 3, 3], // line 4 - bottom row 4
    [0, 1, 2, 1, 0], // line 5
    [2, 1, 0, 1, 2], // line 6
    [0, 0, 1, 2, 2], // line 7
    [2, 2, 1, 0, 0], // line 8
    [1, 0, 0, 0, 1], // line 9
    [1, 2, 2, 2, 1], // line 10
    [0, 1, 0, 1, 0], // line 11
    [2, 1, 2, 1, 2], // line 12
    [1, 0, 1, 0, 1], // line 13
    [1, 2, 1, 2, 1], // line 14
    [3, 2, 1, 0, 0], // line 15
    [0, 1, 2, 3, 3], // line 16
    [3, 3, 2, 1, 0], // line 17
    [0, 0, 1, 2, 3], // line 18
    [1, 1, 2, 3, 3], // line 19
];

// Reel strips (weighted symbol distribution - 3 Wilds per reel at random positions)
const REEL_STRIPS = [
    ['J','Q','W','K','A','M2','M1','H3','H2','H1','SC','J','Q','K','W','A','M2','M1','H3','J','Q','K','A','M2','M1','W','J','Q','H2','H3'],
    ['J','Q','K','A','M2','W','M1','H3','H2','H1','SC','J','Q','K','A','M2','M1','W','H3','J','Q','K','A','W','M2','M1','J','Q','H2','H3'],
    ['J','W','Q','K','A','M2','M1','H3','H2','H1','SC','J','Q','K','A','W','M2','M1','H3','J','Q','K','A','M2','M1','J','W','Q','H2','H3'],
    ['J','Q','K','A','M2','M1','W','H3','H2','H1','SC','J','Q','W','K','A','M2','M1','H3','J','Q','K','W','A','M2','M1','J','Q','H2','H3'],
    ['W','J','Q','K','A','M2','M1','H3','H2','W','H1','SC','J','Q','K','A','M2','M1','H3','J','Q','K','A','M2','W','M1','J','Q','H2','H3'],
];

// Game State
let state = {
    balance: 1000,
    stake: 1.00,
    stakeIndex: 9,
    spinning: false,
    grid: [], // 5 columns x 4 rows
    inFreeGames: false,
    freeSpinsRemaining: 0,
    freeGameLevel: 0,
    freeGameScatters: 0,
    bonusBet: false,
    wildMultiplier: 1,
    totalWin: 0,
    autoplayRemaining: 0,
    autoplayRunning: false
};

// DOM Elements
const els = {};

function initDOM() {
    els.spinBtn = document.getElementById('spin-btn');
    els.stakeDisplay = document.getElementById('stake-display');
    els.stakeDown = document.getElementById('stake-down');
    els.stakeUp = document.getElementById('stake-up');
    els.winAmount = document.getElementById('win-amount');
    els.balanceAmount = document.getElementById('balance-amount');
    els.bonusBetToggle = document.getElementById('bonus-bet-toggle');
    els.bonusBuyBtn = document.getElementById('bonus-buy-btn');
    els.freeGamesPanel = document.getElementById('free-games-panel');
    els.fgSpinsCount = document.getElementById('fg-spins-count');
    els.fgLevelDisplay = document.getElementById('fg-level-display');
    els.fgScatterCount = document.getElementById('fg-scatter-count');
    els.fgScatterNext = document.getElementById('fg-scatter-next');
    els.fgTotalWinAmount = document.getElementById('fg-total-win-amount');
    els.wildRespinBanner = document.getElementById('wild-respin-banner');
    els.multiplierBanner = document.getElementById('multiplier-banner');
    els.multiplierValue = document.getElementById('multiplier-value');
    els.featureInfo = document.getElementById('feature-info');
    els.stopAutoBtn = document.getElementById('stop-auto-btn');
    els.autoRemaining = document.getElementById('auto-remaining');
    els.reelStrips = [];
    for (let i = 0; i < 5; i++) {
        els.reelStrips.push(document.querySelector(`#reel-${i} .reel-strip`));
    }
}

// ===== REEL RENDERING =====

function createSymbolCell(symbolKey) {
    const sym = SYMBOLS[symbolKey];
    const cell = document.createElement('div');
    cell.className = `symbol-cell ${sym.class}`;
    cell.dataset.symbol = symbolKey;
    const icon = document.createElement('div');
    icon.className = 'symbol-icon';
    icon.textContent = sym.display;
    cell.appendChild(icon);

    // Add multiplier badge to wilds when multiplier is active
    if (symbolKey === 'W' && state.wildMultiplier > 1) {
        const badge = document.createElement('div');
        badge.className = 'wild-multiplier-badge';
        badge.textContent = `x${state.wildMultiplier}`;
        icon.appendChild(badge);
    }

    return cell;
}

function renderReelStrip(reelIndex, symbols) {
    const strip = els.reelStrips[reelIndex];
    strip.innerHTML = '';
    symbols.forEach(sym => {
        strip.appendChild(createSymbolCell(sym));
    });
}

function setReelPosition(reelIndex, position) {
    const strip = els.reelStrips[reelIndex];
    strip.style.transform = `translateY(-${position}px)`;
}

// ===== OUTCOME-DRIVEN GRID GENERATION =====
// Win frequency buckets (target distribution)
const WIN_BUCKETS = [
    { min: 0,      max: 0,      weight: 0.65,   label: 'no-win' },
    { min: 0.01,   max: 0.50,   weight: 0.168,  label: '0.01-0.50x' },
    { min: 0.51,   max: 0.99,   weight: 0.065,  label: '0.51-0.99x' },
    { min: 1.00,   max: 1.00,   weight: 0.024,  label: '1x' },
    { min: 1.01,   max: 10.00,  weight: 0.08,   label: '1.01-10x' },
    { min: 10.01,  max: 100.00, weight: 0.013,  label: '10.01-100x' },
    { min: 100.01, max: 9999,   weight: 0.0011, label: '100x+' },
];

function selectWinBucket() {
    const rand = Math.random();
    let cumulative = 0;
    for (const bucket of WIN_BUCKETS) {
        cumulative += bucket.weight;
        if (rand <= cumulative) return bucket;
    }
    return WIN_BUCKETS[0]; // fallback no-win
}

// Non-wild, non-scatter symbols for filling
const FILL_SYMBOLS = ['J', 'Q', 'K', 'A', 'M2', 'M1', 'H3', 'H2', 'H1'];

function randomFill() {
    // 10% chance to place a wild on any random fill position
    if (Math.random() < 0.10) return 'W';
    return FILL_SYMBOLS[Math.floor(Math.random() * FILL_SYMBOLS.length)];
}

// Generate a grid that produces no wins on any of the 19 lines
function generateNoWinGrid() {
    const grid = [];
    for (let r = 0; r < CONFIG.reels; r++) {
        grid[r] = [];
        for (let row = 0; row < CONFIG.rows; row++) {
            // No wilds on no-win grids (wilds act as substitutes so they'd create wins)
            grid[r][row] = FILL_SYMBOLS[Math.floor(Math.random() * FILL_SYMBOLS.length)];
        }
    }

    // Verify no wins exist, break any 3+ consecutive matches on winlines
    let attempts = 0;
    while (attempts < 50) {
        const wins = evaluateGridWins(grid);
        if (wins.length === 0) break;
        // Break the first winning line by changing reel 2 symbol on that line
        for (const win of wins) {
            const line = WINLINES[win.lineIndex];
            const reelToBreak = 2; // break at reel 2
            const row = line[reelToBreak];
            let newSym;
            do {
                newSym = FILL_SYMBOLS[Math.floor(Math.random() * FILL_SYMBOLS.length)];
            } while (newSym === grid[0][line[0]] || newSym === grid[1][line[1]]);
            grid[reelToBreak][row] = newSym;
        }
        attempts++;
    }
    return grid;
}

// Generate a grid that hits a target win multiplier range
function generateWinGrid(minMult, maxMult) {
    // Strategy: pick a target multiplier, find a symbol+count combo that achieves it,
    // then place that on a random winline and fill the rest to avoid other wins

    // Build list of possible single-line wins
    const possibleWins = [];
    for (const sym of FILL_SYMBOLS) {
        const pays = PAYTABLE[sym];
        for (let count = 2; count <= 5; count++) {
            const pay = pays[count - 2];
            if (pay > 0 && pay >= minMult && pay <= maxMult) {
                possibleWins.push({ symbol: sym, count: count, pay: pay });
            }
        }
    }

    // For high multipliers, consider multiple line wins or wilds
    if (possibleWins.length === 0 || minMult > 10) {
        return generateHighWinGrid(minMult, maxMult);
    }

    // Pick a random valid win
    const chosen = possibleWins[Math.floor(Math.random() * possibleWins.length)];
    const targetLine = Math.floor(Math.random() * WINLINES.length);
    const line = WINLINES[targetLine];

    // Start with a no-win grid base
    const grid = [];
    for (let r = 0; r < CONFIG.reels; r++) {
        grid[r] = [];
        for (let row = 0; row < CONFIG.rows; row++) {
            grid[r][row] = randomFill();
        }
    }

    // Place the winning symbol on the chosen line, sometimes substituting wilds
    for (let i = 0; i < chosen.count; i++) {
        // 30% chance each position is a wild instead of the paying symbol
        if (Math.random() < 0.30) {
            grid[i][line[i]] = 'W';
        } else {
            grid[i][line[i]] = chosen.symbol;
        }
    }

    // Make sure the symbol after the winning run breaks the line
    if (chosen.count < 5) {
        let breakSym;
        do {
            breakSym = FILL_SYMBOLS[Math.floor(Math.random() * FILL_SYMBOLS.length)];
        } while (breakSym === chosen.symbol);
        grid[chosen.count][line[chosen.count]] = breakSym;
    }

    // Verify total win is in range, fix if needed
    const totalWin = getTotalGridWin(grid);
    if (totalWin >= minMult && totalWin <= maxMult) {
        return grid;
    }

    // If not in range (due to accidental extra wins), try to break other wins
    let attempts = 0;
    while (attempts < 30) {
        const wins = evaluateGridWins(grid);
        const extraWins = wins.filter(w => w.lineIndex !== targetLine);
        if (extraWins.length === 0) break;
        for (const w of extraWins) {
            const wLine = WINLINES[w.lineIndex];
            const reelToBreak = Math.min(2, w.count - 1);
            let newSym;
            do { newSym = FILL_SYMBOLS[Math.floor(Math.random() * FILL_SYMBOLS.length)]; } while (newSym === w.symbol);
            // Only break if it doesn't disrupt our target line
            if (wLine[reelToBreak] !== line[reelToBreak] || reelToBreak >= chosen.count) {
                grid[reelToBreak][wLine[reelToBreak]] = newSym;
            }
        }
        attempts++;
    }

    return grid;
}

function generateHighWinGrid(minMult, maxMult) {
    const grid = [];
    for (let r = 0; r < CONFIG.reels; r++) {
        grid[r] = [];
        for (let row = 0; row < CONFIG.rows; row++) {
            grid[r][row] = randomFill();
        }
    }

    if (minMult > 100) {
        // Multiple high-value 5-of-a-kind wins with wilds
        // Place H1 on multiple lines with wilds helping
        const linesToUse = [0, 1, 2, 3]; // use 4 lines
        const shuffled = [...linesToUse].sort(() => Math.random() - 0.5);
        const numLines = Math.min(2 + Math.floor(Math.random() * 3), 4);
        const highSyms = ['H1', 'H2', 'H3'];

        for (let l = 0; l < numLines; l++) {
            const lineIdx = shuffled[l];
            const line = WINLINES[lineIdx];
            const sym = highSyms[Math.floor(Math.random() * highSyms.length)];
            for (let i = 0; i < 5; i++) {
                // Mix in some wilds
                if (Math.random() < 0.4) {
                    grid[i][line[i]] = 'W';
                } else {
                    grid[i][line[i]] = sym;
                }
            }
        }
    } else if (minMult > 10) {
        // 4 or 5 of a kind with high symbols, possibly on multiple lines
        const numLines = 1 + Math.floor(Math.random() * 2);
        const highSyms = ['H1', 'H2', 'H3', 'M1', 'M2'];
        const usedLines = [];

        for (let l = 0; l < numLines; l++) {
            let lineIdx;
            do { lineIdx = Math.floor(Math.random() * WINLINES.length); } while (usedLines.includes(lineIdx));
            usedLines.push(lineIdx);
            const line = WINLINES[lineIdx];
            const sym = highSyms[Math.floor(Math.random() * highSyms.length)];
            const count = 4 + Math.floor(Math.random() * 2); // 4 or 5
            for (let i = 0; i < Math.min(count, 5); i++) {
                if (Math.random() < 0.25) {
                    grid[i][line[i]] = 'W';
                } else {
                    grid[i][line[i]] = sym;
                }
            }
            if (count < 5) {
                let breakSym;
                do { breakSym = randomFill(); } while (breakSym === sym);
                grid[count][line[count]] = breakSym;
            }
        }
    }

    return grid;
}

// Evaluate wins on a grid without modifying game state
function evaluateGridWins(grid) {
    const wins = [];
    for (let lineIdx = 0; lineIdx < WINLINES.length; lineIdx++) {
        const line = WINLINES[lineIdx];
        const lineSymbols = line.map((row, reel) => grid[reel][row]);

        let paySymbol = null;
        let count = 0;
        let hasWild = false;
        let wildInWin = false;

        for (let i = 0; i < 5; i++) {
            const sym = lineSymbols[i];
            if (sym === 'SC') break;
            if (sym === 'W') {
                if (paySymbol === null) { count++; hasWild = true; wildInWin = true; }
                else { count++; wildInWin = true; }
            } else {
                if (paySymbol === null) { paySymbol = sym; count++; }
                else if (sym === paySymbol) { count++; }
                else { break; }
            }
        }

        if (paySymbol === null && hasWild) paySymbol = 'W';

        if (paySymbol && count >= 2 && PAYTABLE[paySymbol]) {
            const payIndex = count - 2;
            const payMultiplier = PAYTABLE[paySymbol][payIndex];
            if (payMultiplier > 0) {
                wins.push({
                    lineIndex: lineIdx,
                    symbol: paySymbol,
                    count: count,
                    pay: payMultiplier,
                    wildInWin: wildInWin
                });
            }
        }
    }
    return wins;
}

function getTotalGridWin(grid) {
    const wins = evaluateGridWins(grid);
    let total = 0;
    wins.forEach(w => { total += w.pay; });
    return total;
}

// Main function: generate a grid based on the target win distribution
function generateOutcomeGrid() {
    const bucket = selectWinBucket();

    let grid;
    if (bucket.label === 'no-win') {
        grid = generateNoWinGrid();
    } else {
        // Generate grid targeting the bucket range
        let attempts = 0;
        const maxAttempts = 20;

        while (attempts < maxAttempts) {
            grid = generateWinGrid(bucket.min, bucket.max);
            const totalWin = getTotalGridWin(grid);

            // Check if we're in the target range
            if (totalWin >= bucket.min && totalWin <= bucket.max) {
                break;
            }
            attempts++;
        }

        if (!grid) grid = generateNoWinGrid();
    }

    // Scatter placement: ~1.5% chance to place 3+ scatters for feature trigger
    // (only in base game, free games handle scatters separately)
    if (!state.inFreeGames) {
        const scatterRoll = Math.random();
        if (scatterRoll < 0.015) {
            // Place 3-5 scatters in random positions
            const numScatters = scatterRoll < 0.002 ? 5 : (scatterRoll < 0.005 ? 4 : 3);
            const positions = [];
            while (positions.length < numScatters) {
                const r = Math.floor(Math.random() * CONFIG.reels);
                const row = Math.floor(Math.random() * CONFIG.rows);
                if (!positions.some(p => p.r === r && p.row === row)) {
                    positions.push({ r, row });
                }
            }
            for (const pos of positions) {
                grid[pos.r][pos.row] = 'SC';
            }
        }
    } else {
        // During free games, small chance to land scatters for level-up
        if (state.freeGameLevel < 4 && Math.random() < 0.12) {
            const numScatters = 1 + Math.floor(Math.random() * 3);
            const positions = [];
            while (positions.length < numScatters) {
                const r = Math.floor(Math.random() * CONFIG.reels);
                const row = Math.floor(Math.random() * CONFIG.rows);
                if (!positions.some(p => p.r === r && p.row === row)) {
                    positions.push({ r, row });
                }
            }
            for (const pos of positions) {
                grid[pos.r][pos.row] = 'SC';
            }
        }
    }

    return grid;
}

// ===== SPIN ANIMATION =====

function getRandomStopPosition(reelIndex) {
    const stripLength = REEL_STRIPS[reelIndex].length;
    return Math.floor(Math.random() * stripLength);
}

function getVisibleSymbols(reelIndex, stopPos) {
    const strip = REEL_STRIPS[reelIndex];
    const len = strip.length;
    const symbols = [];
    for (let r = 0; r < CONFIG.rows; r++) {
        symbols.push(strip[(stopPos + r) % len]);
    }
    return symbols;
}

async function spinReels(forceResult) {
    state.spinning = true;
    els.spinBtn.disabled = true;
    els.winAmount.textContent = '0.00';
    clearHighlights();

    // Build extended strips for animation (many extra symbols for scrolling effect)
    const extraSymbols = 20; // extra symbols to scroll through
    const resultGrid = [];

    // Use outcome-driven grid generation for target win frequencies
    let outcomeGrid;
    if (forceResult) {
        // forceResult is now a pre-built grid (5 columns x 4 rows)
        outcomeGrid = forceResult;
    } else {
        outcomeGrid = generateOutcomeGrid();
    }

    for (let i = 0; i < CONFIG.reels; i++) {
        const visible = outcomeGrid[i];
        resultGrid.push(visible);

        // Build animation strip: final visible symbols first, then random symbols after
        const animStrip = [];
        const strip = REEL_STRIPS[i];
        const len = strip.length;
        for (let s = 0; s < CONFIG.rows + extraSymbols; s++) {
            if (s < CONFIG.rows) {
                animStrip.push(visible[s]);
            } else {
                animStrip.push(strip[Math.floor(Math.random() * len)]);
            }
        }
        renderReelStrip(i, animStrip);
        // Start positioned at the bottom (showing random symbols), animate up to show final symbols
        setReelPosition(i, extraSymbols * CONFIG.symbolHeight);
    }

    state.grid = resultGrid;

    // Animate each reel with staggered landing
    const baseSpinDuration = CONFIG.totalSpinTime - (CONFIG.reels - 1) * CONFIG.reelDelay;

    const reelPromises = [];
    for (let i = 0; i < CONFIG.reels; i++) {
        const duration = baseSpinDuration + i * CONFIG.reelDelay;
        reelPromises.push(animateReel(i, duration, extraSymbols));
    }

    await Promise.all(reelPromises);

    // Render final grid cleanly
    for (let i = 0; i < CONFIG.reels; i++) {
        renderReelStrip(i, state.grid[i]);
        setReelPosition(i, 0);
    }

    state.spinning = false;
}

function animateReel(reelIndex, duration, totalExtraSymbols) {
    return new Promise(resolve => {
        const strip = els.reelStrips[reelIndex];
        const totalDistance = totalExtraSymbols * CONFIG.symbolHeight;
        const startTime = performance.now();

        function tick(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing: fast start, slow end (ease-out cubic)
            const eased = 1 - Math.pow(1 - progress, 3);
            const currentPos = totalDistance - (eased * totalDistance);

            strip.style.transform = `translateY(-${currentPos}px)`;

            if (progress < 1) {
                requestAnimationFrame(tick);
            } else {
                // Snap to final position (top, showing the visible symbols)
                strip.style.transform = `translateY(0px)`;
                resolve();
            }
        }

        requestAnimationFrame(tick);
    });
}

// ===== WIN EVALUATION =====

function evaluateWins() {
    const wins = [];
    const grid = state.grid; // grid[reel][row]

    for (let lineIdx = 0; lineIdx < WINLINES.length; lineIdx++) {
        const line = WINLINES[lineIdx];
        const lineSymbols = line.map((row, reel) => grid[reel][row]);

        // Determine the paying symbol (first non-wild, or wild if all wilds)
        let paySymbol = null;
        let count = 0;
        let hasWild = false;
        let wildInWin = false;

        for (let i = 0; i < 5; i++) {
            const sym = lineSymbols[i];
            if (sym === 'SC') break; // Scatters don't count on lines

            if (sym === 'W') {
                if (paySymbol === null) {
                    count++;
                    hasWild = true;
                    wildInWin = true;
                } else {
                    count++;
                    wildInWin = true;
                }
            } else {
                if (paySymbol === null) {
                    paySymbol = sym;
                    count++;
                } else if (sym === paySymbol) {
                    count++;
                } else {
                    break;
                }
            }
        }

        // If all were wilds, pay as wild
        if (paySymbol === null && hasWild) {
            paySymbol = 'W';
        }

        if (paySymbol && count >= 2 && PAYTABLE[paySymbol]) {
            const payIndex = count - 2; // 0=2x, 1=3x, 2=4x, 3=5x
            const payMultiplier = PAYTABLE[paySymbol][payIndex];
            if (payMultiplier > 0) {
                wins.push({
                    lineIndex: lineIdx,
                    symbol: paySymbol,
                    count: count,
                    pay: payMultiplier,
                    positions: line.slice(0, count).map((row, reel) => ({ reel, row })),
                    wildInWin: wildInWin
                });
            }
        }
    }

    return wins;
}

function countSymbolOnGrid(symbolKey) {
    let count = 0;
    for (let r = 0; r < CONFIG.reels; r++) {
        for (let row = 0; row < CONFIG.rows; row++) {
            if (state.grid[r][row] === symbolKey) count++;
        }
    }
    return count;
}

function getWildPositions() {
    const positions = [];
    for (let r = 0; r < CONFIG.reels; r++) {
        for (let row = 0; row < CONFIG.rows; row++) {
            if (state.grid[r][row] === 'W') {
                positions.push({ reel: r, row: row });
            }
        }
    }
    return positions;
}

// ===== WILD RESPIN =====

async function wildRespin() {
    const wildCount = countSymbolOnGrid('W');
    if (wildCount < 3) return false;

    // Show banner
    els.wildRespinBanner.classList.remove('hidden');
    await delay(1200);
    els.wildRespinBanner.classList.add('hidden');

    // Lock existing wilds
    let lockedPositions = getWildPositions();
    highlightWilds(lockedPositions);

    let newWildsLanded = true;
    while (newWildsLanded) {
        await delay(800);
        newWildsLanded = false;

        // Determine which non-wild positions could become wild
        const candidates = [];
        for (let r = 0; r < CONFIG.reels; r++) {
            for (let row = 0; row < CONFIG.rows; row++) {
                const isLocked = lockedPositions.some(p => p.reel === r && p.row === row);
                if (!isLocked) {
                    candidates.push({ reel: r, row: row });
                }
            }
        }

        // Random chance for each non-wild position to become a wild
        const newWilds = [];
        for (const pos of candidates) {
            // ~5% chance per cell to land a wild on respin
            if (Math.random() < 0.05) {
                newWilds.push(pos);
            }
        }

        if (newWilds.length > 0) {
            newWildsLanded = true;

            // Overlay new wilds onto grid (existing symbols stay)
            for (const pos of newWilds) {
                state.grid[pos.reel][pos.row] = 'W';
            }

            // Re-render to show new wilds overlaid
            for (let i = 0; i < CONFIG.reels; i++) {
                renderReelStrip(i, state.grid[i]);
                setReelPosition(i, 0);
            }

            // Animate the new wilds dropping in
            for (const pos of newWilds) {
                const reel = els.reelStrips[pos.reel];
                const cells = reel.querySelectorAll('.symbol-cell');
                if (cells[pos.row]) {
                    cells[pos.row].classList.add('wild-overlay-in');
                }
            }

            await delay(600);

            // Update locked positions
            lockedPositions = getWildPositions();
            highlightWilds(lockedPositions);
        }

        // Check if grid is full of wilds
        if (lockedPositions.length >= CONFIG.reels * CONFIG.rows) break;
    }

    // Base game random multiplier upgrade
    if (!state.inFreeGames) {
        const shouldUpgrade = Math.random() < 0.15; // 15% random trigger
        if (shouldUpgrade) {
            const multipliers = [2, 5, 10, 25];
            state.wildMultiplier = multipliers[Math.floor(Math.random() * multipliers.length)];
            els.multiplierValue.textContent = state.wildMultiplier;
            els.multiplierBanner.classList.remove('hidden');
            await delay(1500);
            els.multiplierBanner.classList.add('hidden');

            // Re-render grid to show multiplier badges on wilds
            for (let i = 0; i < CONFIG.reels; i++) {
                renderReelStrip(i, state.grid[i]);
                setReelPosition(i, 0);
            }
        }
    }

    return true;
}

function highlightWilds(positions) {
    clearHighlights();
    positions.forEach(p => {
        const reel = els.reelStrips[p.reel];
        const cells = reel.querySelectorAll('.symbol-cell');
        if (cells[p.row]) {
            cells[p.row].classList.add('wild-locked');
        }
    });
}

// ===== FREE GAMES =====

function checkFreeGamesTrigger() {
    const scatterCount = countSymbolOnGrid('SC');
    if (scatterCount >= 3 && !state.inFreeGames) {
        return scatterCount;
    }
    return 0;
}

function startFreeGames(scatterCount) {
    state.inFreeGames = true;
    state.freeSpinsRemaining = 8;
    state.freeGameScatters = 0;
    state.totalWin = 0;

    if (scatterCount === 3) {
        state.freeGameLevel = 0;
        state.wildMultiplier = 1;
    } else if (scatterCount === 4) {
        state.freeGameLevel = 2;
        state.wildMultiplier = 5;
    } else if (scatterCount >= 5) {
        state.freeGameLevel = 3;
        state.wildMultiplier = 10;
    }

    updateFreeGamesUI();
    els.freeGamesPanel.classList.remove('hidden');
    els.featureInfo.textContent = `FREE GAMES - Level ${state.freeGameLevel} | Multiplier x${state.wildMultiplier}`;
}

function addFreeGameScatters(count) {
    if (state.freeGameLevel >= 4) return; // Max level reached

    state.freeGameScatters += count;

    // Check level thresholds
    const thresholds = [4, 8, 12, 16];
    const multipliers = [2, 5, 10, 25];

    for (let i = state.freeGameLevel; i < 4; i++) {
        if (state.freeGameScatters >= thresholds[i]) {
            state.freeGameLevel = i + 1;
            state.wildMultiplier = multipliers[i];
            state.freeSpinsRemaining += 4;
            els.featureInfo.textContent = `LEVEL UP! Level ${state.freeGameLevel} | Multiplier x${state.wildMultiplier}`;
        }
    }

    updateFreeGamesUI();
}

function updateFreeGamesUI() {
    els.fgSpinsCount.textContent = state.freeSpinsRemaining;
    els.fgLevelDisplay.textContent = state.freeGameLevel;
    els.fgScatterCount.textContent = state.freeGameScatters;
    els.fgTotalWinAmount.textContent = state.totalWin.toFixed(2);

    const thresholds = [4, 8, 12, 16];
    const nextThreshold = state.freeGameLevel < 4 ? thresholds[state.freeGameLevel] : 'MAX';
    els.fgScatterNext.textContent = nextThreshold;
}

function endFreeGames() {
    state.inFreeGames = false;
    state.freeGameLevel = 0;
    state.wildMultiplier = 1;
    state.freeGameScatters = 0;
    els.freeGamesPanel.classList.add('hidden');
    els.featureInfo.textContent = `FREE GAMES ENDED! Total Win: ${state.totalWin.toFixed(2)}`;
    setTimeout(() => { els.featureInfo.textContent = ''; }, 4000);
}

// ===== MAIN SPIN LOGIC =====

async function doSpin() {
    if (state.spinning) return;

    const cost = state.bonusBet ? state.stake * 1.2 : state.stake;

    if (!state.inFreeGames) {
        if (state.balance < cost) {
            els.featureInfo.textContent = 'Insufficient balance!';
            return;
        }
        state.balance -= cost;
        updateBalance();
    } else {
        state.freeSpinsRemaining--;
        updateFreeGamesUI();
    }

    state.wildMultiplier = state.inFreeGames ? getMultiplierForLevel(state.freeGameLevel) : 1;

    // Spin reels
    await spinReels();

    // Wild Respin check (3+ wilds)
    const wildRespinTriggered = await wildRespin();

    // Evaluate wins
    const wins = evaluateWins();
    let totalWin = 0;

    wins.forEach(win => {
        let winAmount = win.pay * state.stake;
        // Apply wild multiplier if wild was involved in win
        if (win.wildInWin && state.wildMultiplier > 1) {
            winAmount *= state.wildMultiplier;
        }
        totalWin += winAmount;
    });

    // Show wins
    if (totalWin > 0) {
        state.balance += totalWin;
        state.totalWin += totalWin;
        els.winAmount.textContent = totalWin.toFixed(2);
        updateBalance();
        highlightWinningSymbols(wins);

        if (state.inFreeGames) {
            updateFreeGamesUI();
        }

        // 2 second delay on any winning spin
        await delay(2000);
    }

    // Check scatter triggers
    const scatterCount = countSymbolOnGrid('SC');

    if (state.inFreeGames && scatterCount > 0 && state.freeGameLevel < 4) {
        addFreeGameScatters(scatterCount);
    } else if (!state.inFreeGames && scatterCount >= 3) {
        await delay(800);
        startFreeGames(scatterCount);
    }

    // Free games continuation
    if (state.inFreeGames && state.freeSpinsRemaining <= 0) {
        await delay(1000);
        endFreeGames();
    }

    els.spinBtn.disabled = false;

    // Auto-spin in free games
    if (state.inFreeGames && state.freeSpinsRemaining > 0) {
        await delay(800);
        doSpin();
    }
}

function getMultiplierForLevel(level) {
    const mults = [1, 2, 5, 10, 25];
    return mults[level] || 1;
}

// ===== BONUS BUY =====

function bonusBuy() {
    if (state.spinning || state.inFreeGames) return;

    const cost = state.stake * 80; // Typical bonus buy cost
    if (state.balance < cost) {
        els.featureInfo.textContent = 'Insufficient balance for Bonus Buy!';
        return;
    }

    if (!confirm(`Buy Bonus for ${cost.toFixed(2)}?`)) return;

    state.balance -= cost;
    updateBalance();

    // Random scatter count: weighted towards 3
    const rand = Math.random();
    let scatterCount;
    if (rand < 0.7) scatterCount = 3;
    else if (rand < 0.92) scatterCount = 4;
    else scatterCount = 5;

    startFreeGames(scatterCount);
    els.featureInfo.textContent = `BONUS BUY! ${scatterCount} Scatters - ${state.freeSpinsRemaining} Free Spins at Level ${state.freeGameLevel}`;

    // Start spinning
    setTimeout(() => doSpin(), 800);
}

// ===== AUTOPLAY =====

async function startAutoplay(spins) {
    state.autoplayRemaining = spins;
    state.autoplayRunning = true;
    els.stopAutoBtn.classList.remove('hidden');
    els.autoRemaining.classList.remove('hidden');
    updateAutoplayUI();

    // Hide normal auto buttons
    document.querySelectorAll('.btn-auto[data-spins]').forEach(b => b.classList.add('hidden'));

    while (state.autoplayRemaining > 0 && state.autoplayRunning) {
        if (state.balance < state.stake) {
            stopAutoplay();
            break;
        }

        updateAutoplayUI();
        await doSpin();

        // Wait for free games to finish if triggered
        while (state.inFreeGames) {
            await delay(500);
        }

        state.autoplayRemaining--;
        updateAutoplayUI();

        if (state.autoplayRemaining > 0 && state.autoplayRunning) {
            await delay(500);
        }
    }

    stopAutoplay();
}

function stopAutoplay() {
    state.autoplayRunning = false;
    state.autoplayRemaining = 0;
    els.stopAutoBtn.classList.add('hidden');
    els.autoRemaining.classList.add('hidden');
    document.querySelectorAll('.btn-auto[data-spins]').forEach(b => b.classList.remove('hidden'));
}

function updateAutoplayUI() {
    els.autoRemaining.textContent = `${state.autoplayRemaining} left`;
}

// ===== UI HELPERS =====

function updateBalance() {
    els.balanceAmount.textContent = state.balance.toFixed(2);
}

function updateStakeDisplay() {
    els.stakeDisplay.textContent = state.stake.toFixed(2);
}

function highlightWinningSymbols(wins) {
    wins.forEach(win => {
        win.positions.forEach(pos => {
            const reel = els.reelStrips[pos.reel];
            const cells = reel.querySelectorAll('.symbol-cell');
            if (cells[pos.row]) {
                cells[pos.row].classList.add('highlight');
            }
        });
    });
}

function clearHighlights() {
    document.querySelectorAll('.symbol-cell.highlight, .symbol-cell.wild-locked, .symbol-cell.wild-overlay-in').forEach(el => {
        el.classList.remove('highlight', 'wild-locked', 'wild-overlay-in');
    });
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ===== EVENT HANDLERS =====

function setupEvents() {
    els.spinBtn.addEventListener('click', doSpin);

    els.stakeDown.addEventListener('click', () => {
        if (state.spinning || state.autoplayRunning) return;
        if (state.stakeIndex > 0) {
            state.stakeIndex--;
            state.stake = CONFIG.stakes[state.stakeIndex];
            updateStakeDisplay();
        }
    });

    els.stakeUp.addEventListener('click', () => {
        if (state.spinning || state.autoplayRunning) return;
        if (state.stakeIndex < CONFIG.stakes.length - 1) {
            state.stakeIndex++;
            state.stake = CONFIG.stakes[state.stakeIndex];
            updateStakeDisplay();
        }
    });

    els.bonusBetToggle.addEventListener('change', (e) => {
        state.bonusBet = e.target.checked;
    });

    els.bonusBuyBtn.addEventListener('click', bonusBuy);

    // Autoplay buttons
    document.querySelectorAll('.btn-auto[data-spins]').forEach(btn => {
        btn.addEventListener('click', () => {
            if (state.spinning || state.autoplayRunning || state.inFreeGames) return;
            const spins = parseInt(btn.dataset.spins);
            startAutoplay(spins);
        });
    });

    els.stopAutoBtn.addEventListener('click', stopAutoplay);

    // Spacebar to spin
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !state.spinning) {
            e.preventDefault();
            if (state.autoplayRunning) {
                stopAutoplay();
            } else {
                doSpin();
            }
        }
    });
}

// ===== INITIALIZATION =====

function initGrid() {
    // Set initial random grid
    for (let i = 0; i < CONFIG.reels; i++) {
        const stopPos = getRandomStopPosition(i);
        state.grid[i] = getVisibleSymbols(i, stopPos);
        renderReelStrip(i, state.grid[i]);
        setReelPosition(i, 0);
    }
}

function init() {
    initDOM();
    setupEvents();
    initGrid();
    updateBalance();
    updateStakeDisplay();
}

document.addEventListener('DOMContentLoaded', init);
