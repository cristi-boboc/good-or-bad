'use strict';

// ===================== GAME LOGIC & UI =====================
class Game {
    constructor() {
        this.audio = new AudioEngine();
        this.net = null;
        this.isHost = false;
        this.players = new Map(); // id -> {name, score, color, order}
        this.myId = null;
        this.myName = '';
        this.pin = '';
        this.currentRound = 0;
        this.currentItemIdx = 0;
        this.currentIsGood = false;
        this.roundGrabbed = false;
        this.grabTimer = null;
        this.roundActive = false;
        this.gameInProgress = false;

        this._initUI();
    }

    // ---- UI BINDING ----
    _initUI() {
        // Home
        document.getElementById('btn-host').onclick = () => this._hostSetup();
        document.getElementById('btn-join').onclick = () => this._joinSetup();
        // Host setup
        document.getElementById('btn-create').onclick = () => this._createGame();
        // Join setup
        document.getElementById('btn-connect').onclick = () => this._connectGame();
        // Lobby
        document.getElementById('btn-start').onclick = () => this._startGame();
        // Game
        document.getElementById('btn-grab').onclick = () => this._onGrab();
        // Game over
        document.getElementById('btn-play-again').onclick = () => this._playAgain();
        document.getElementById('btn-home').onclick = () => this._goHome();
        // Back buttons
        document.querySelectorAll('.btn-back').forEach(btn => {
            btn.onclick = () => this._showScreen(btn.dataset.screen);
        });
        // Audio toggle
        document.getElementById('btn-audio').onclick = () => {
            this.audio.init();
            const muted = this.audio.toggleMute();
            document.getElementById('btn-audio').classList.toggle('muted', muted);
        };
        // Init audio on first interaction
        document.addEventListener('click', () => this.audio.init(), { once: true });
        // Enter key on inputs
        document.getElementById('host-name').addEventListener('keydown', e => {
            if (e.key === 'Enter') this._createGame();
        });
        document.getElementById('join-pin').addEventListener('keydown', e => {
            if (e.key === 'Enter') this._connectGame();
        });
    }

    _showScreen(name) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('screen-' + name).classList.add('active');
    }

    _showOverlay(text) {
        document.getElementById('overlay-text').textContent = text;
        document.getElementById('overlay').style.display = 'flex';
    }

    _hideOverlay() {
        document.getElementById('overlay').style.display = 'none';
    }

    // ---- HOST SETUP ----
    _hostSetup() {
        this._showScreen('host-setup');
        document.getElementById('host-name').focus();
    }

    async _createGame() {
        const name = document.getElementById('host-name').value.trim();
        if (!name) { document.getElementById('host-name').focus(); return; }
        this.myName = name;
        this.isHost = true;

        this._showOverlay('Creating game...');

        this.net = new GameNetwork(
            (msg, from) => this._onHostMessage(msg, from),
            (peerId, pName) => this._onPeerJoined(peerId, pName),
            (peerId) => this._onPeerLeft(peerId),
            (err) => { alert(err); this._goHome(); }
        );

        // Try up to 3 PINs
        for (let attempt = 0; attempt < 3; attempt++) {
            this.pin = this.net.generatePin();
            try {
                await this.net.createGame(this.pin);
                break;
            } catch (e) {
                if (attempt === 2) {
                    this._hideOverlay();
                    alert('Could not create game. Please try again.');
                    return;
                }
            }
        }

        this.myId = this.net.myId;
        // Add host as first player
        this.players.set(this.myId, {
            name: this.myName, score: 0,
            color: PLAYER_COLORS[0], order: 0
        });

        this._hideOverlay();
        document.getElementById('lobby-pin').textContent = this.pin;
        this._updateLobby();
        this._showScreen('lobby');
        this.audio.startMusic();
    }

    // ---- JOIN SETUP ----
    _joinSetup() {
        this._showScreen('join-setup');
        document.getElementById('join-name').focus();
    }

    async _connectGame() {
        const name = document.getElementById('join-name').value.trim();
        const pin = document.getElementById('join-pin').value.trim();
        if (!name) { document.getElementById('join-name').focus(); return; }
        if (pin.length !== 5) { document.getElementById('join-pin').focus(); return; }

        this.myName = name;
        this.pin = pin;
        this.isHost = false;

        this._showOverlay('Joining game...');

        this.net = new GameNetwork(
            (msg) => this._onClientMessage(msg),
            () => {},
            () => {},
            (err) => { alert(err); this._goHome(); }
        );

        try {
            await this.net.connectToHost(pin);
            this.myId = this.net.myId;
            this.net.sendToHost({ type: 'join', name: this.myName });
            this._hideOverlay();
        } catch (e) {
            this._hideOverlay();
            alert(e.message || 'Could not connect');
            return;
        }
    }

    // ---- HOST MESSAGE HANDLING ----
    _onHostMessage(msg, from) {
        switch (msg.type) {
            case 'grab':
                this._handleGrab(from);
                break;
        }
    }

    _onPeerJoined(peerId, name) {
        if (this.players.size >= 8) return;
        const order = this.players.size;
        this.players.set(peerId, {
            name, score: 0,
            color: PLAYER_COLORS[order % PLAYER_COLORS.length],
            order
        });
        this.audio.sfxJoin();
        // Send full player list to everyone
        this._broadcastPlayerList();
        this._updateLobby();
    }

    _onPeerLeft(peerId) {
        this.players.delete(peerId);
        this._broadcastPlayerList();
        this._updateLobby();
        if (this.gameInProgress) this._updateScoreboard();
    }

    _broadcastPlayerList() {
        const list = {};
        this.players.forEach((p, id) => { list[id] = p; });
        this.net.broadcast({ type: 'player-list', players: list, pin: this.pin });
    }

    // ---- CLIENT MESSAGE HANDLING ----
    _onClientMessage(msg) {
        switch (msg.type) {
            case 'player-list':
                this.players.clear();
                for (const [id, p] of Object.entries(msg.players)) {
                    this.players.set(id, p);
                }
                this.pin = msg.pin || this.pin;
                document.getElementById('lobby-pin').textContent = this.pin;
                this._updateLobby();
                if (!this.gameInProgress) {
                    this._showScreen('lobby');
                    this.audio.startMusic();
                }
                break;

            case 'game-start':
                this.gameInProgress = true;
                this.players.forEach(p => p.score = 0);
                this._showScreen('game');
                break;

            case 'round-start':
                this._playRound(msg.round, msg.itemIndex, msg.isGood);
                break;

            case 'grabbed':
                this._onGrabResult(msg);
                break;

            case 'timeout':
                this._onTimeout(msg);
                break;

            case 'game-over':
                this._showGameOver(msg);
                break;
        }
    }

    // ---- LOBBY ----
    _updateLobby() {
        const list = document.getElementById('players-list');
        list.innerHTML = '';
        this.players.forEach((p, id) => {
            const tag = document.createElement('div');
            tag.className = 'player-tag' + (id === Array.from(this.players.keys())[0] ? ' host' : '');
            tag.innerHTML = `<span class="player-dot" style="background:${p.color}"></span>${this._esc(p.name)}`;
            list.appendChild(tag);
        });

        const status = document.getElementById('lobby-status');
        status.textContent = this.players.size < 2
            ? 'Waiting for players...'
            : `${this.players.size} players ready!`;

        const startBtn = document.getElementById('btn-start');
        startBtn.style.display = (this.isHost && this.players.size >= 2) ? '' : 'none';

        renderGuide(document.getElementById('item-guide'));
    }

    // ---- GAME FLOW ----
    _startGame() {
        if (!this.isHost) return;
        this.gameInProgress = true;
        this.currentRound = 0;
        this.players.forEach(p => p.score = 0);

        this._broadcastPlayerList();
        this.net.broadcast({ type: 'game-start' });

        this._showScreen('game');
        this.audio.stopMusic();

        setTimeout(() => this._startRound(), 500);
    }

    _startRound() {
        if (!this.isHost) return;
        this.currentRound++;
        this.currentItemIdx = Math.floor(Math.random() * ITEMS.length);
        this.currentIsGood = Math.random() < 0.5;
        this.roundGrabbed = false;

        const data = {
            type: 'round-start',
            round: this.currentRound,
            itemIndex: this.currentItemIdx,
            isGood: this.currentIsGood
        };
        this.net.broadcast(data);
        this._playRound(data.round, data.itemIndex, data.isGood);
    }

    _playRound(round, itemIndex, isGood) {
        this.currentRound = round;
        this.currentItemIdx = itemIndex;
        this.currentIsGood = isGood;
        this.roundActive = false;
        this.gameInProgress = true;

        this._showScreen('game');
        this._updateScoreboard();
        this._updatePlayersRing();

        const cover = document.getElementById('cover');
        const canvas = document.getElementById('item-canvas');
        const grabBtn = document.getElementById('btn-grab');
        const announce = document.getElementById('round-announce');
        const countdown = document.getElementById('countdown-display');
        const resultFlash = document.getElementById('result-flash');
        const msg = document.getElementById('game-message');

        // Reset
        grabBtn.disabled = true;
        cover.classList.remove('revealed');
        resultFlash.className = 'result-flash';
        msg.textContent = '';
        msg.className = 'game-message';

        // Draw item under cover
        drawItem(canvas, itemIndex, isGood);

        // Show round announcement
        announce.textContent = `Round ${round}`;
        announce.className = 'round-announce show';
        const hint = ITEMS[itemIndex].hint;

        setTimeout(() => {
            announce.className = 'round-announce';
            msg.textContent = `${ITEMS[itemIndex].name} — ${hint}`;

            // Countdown
            let count = 3;
            const tick = () => {
                if (count > 0) {
                    countdown.textContent = count;
                    countdown.className = 'countdown-display show';
                    this.audio.sfxCountdown();
                    count--;
                    setTimeout(() => {
                        countdown.className = 'countdown-display';
                        setTimeout(tick, 200);
                    }, 600);
                } else {
                    // Reveal!
                    cover.classList.add('revealed');
                    this.audio.sfxReveal();
                    msg.textContent = isGood
                        ? `${ITEMS[itemIndex].goodLabel} or ${ITEMS[itemIndex].badLabel}?`
                        : `${ITEMS[itemIndex].goodLabel} or ${ITEMS[itemIndex].badLabel}?`;
                    grabBtn.disabled = false;
                    this.roundActive = true;

                    // Grab timeout
                    if (this.grabTimer) clearTimeout(this.grabTimer);
                    this.grabTimer = setTimeout(() => {
                        if (this.roundActive) {
                            this.roundActive = false;
                            grabBtn.disabled = true;
                            if (this.isHost && !this.roundGrabbed) {
                                const timeoutData = { type: 'timeout', itemIndex, isGood };
                                this.net.broadcast(timeoutData);
                                this._onTimeout(timeoutData);
                            }
                        }
                    }, 4000);
                }
            };
            tick();
        }, 1500);
    }

    _onGrab() {
        if (!this.roundActive) return;
        this.roundActive = false;
        document.getElementById('btn-grab').disabled = true;
        this.audio.sfxGrab();

        if (this.isHost) {
            this._handleGrab(this.myId);
        } else {
            this.net.sendToHost({ type: 'grab' });
        }
    }

    _handleGrab(playerId) {
        if (!this.isHost || this.roundGrabbed) return;
        this.roundGrabbed = true;
        this.roundActive = false;
        if (this.grabTimer) { clearTimeout(this.grabTimer); this.grabTimer = null; }

        const player = this.players.get(playerId);
        if (!player) return;

        if (this.currentIsGood) {
            player.score = Math.min(player.score + 1, 99);
        } else {
            player.score = Math.max(player.score - 1, 0);
        }

        const scores = {};
        this.players.forEach((p, id) => { scores[id] = p.score; });

        const result = {
            type: 'grabbed',
            playerId,
            playerName: player.name,
            isGood: this.currentIsGood,
            scores
        };
        this.net.broadcast(result);
        this._onGrabResult(result);
    }

    _onGrabResult(data) {
        this.roundActive = false;
        document.getElementById('btn-grab').disabled = true;
        if (this.grabTimer) { clearTimeout(this.grabTimer); this.grabTimer = null; }

        // Update local scores
        for (const [id, score] of Object.entries(data.scores)) {
            const p = this.players.get(id);
            if (p) p.score = score;
        }

        const flash = document.getElementById('result-flash');
        const msg = document.getElementById('game-message');

        if (data.isGood) {
            flash.className = 'result-flash good';
            msg.className = 'game-message good';
            msg.textContent = `${data.playerName} grabbed ${ITEMS[this.currentItemIdx].goodLabel}! +1`;
            this.audio.sfxGood();
        } else {
            flash.className = 'result-flash bad';
            msg.className = 'game-message bad';
            msg.textContent = `${data.playerName} grabbed ${ITEMS[this.currentItemIdx].badLabel}! -1`;
            this.audio.sfxBad();
        }

        this._updateScoreboard();

        // Check for winner
        const winnerId = this._checkWin();
        setTimeout(() => {
            if (winnerId) {
                if (this.isHost) {
                    const scores = {};
                    this.players.forEach((p, id) => { scores[id] = p.score; });
                    const overData = { type: 'game-over', winnerId, winnerName: this.players.get(winnerId).name, scores };
                    this.net.broadcast(overData);
                    this._showGameOver(overData);
                }
            } else if (this.isHost) {
                this._startRound();
            }
        }, 2200);
    }

    _onTimeout(data) {
        this.roundActive = false;
        document.getElementById('btn-grab').disabled = true;

        const msg = document.getElementById('game-message');
        msg.className = 'game-message';

        const label = data.isGood ? ITEMS[data.itemIndex].goodLabel : ITEMS[data.itemIndex].badLabel;
        msg.textContent = `Nobody grabbed it! It was: ${label}`;

        setTimeout(() => {
            if (this.isHost) this._startRound();
        }, 1800);
    }

    _checkWin() {
        for (const [id, p] of this.players) {
            if (p.score >= WINNING_SCORE) return id;
        }
        return null;
    }

    // ---- GAME OVER ----
    _showGameOver(data) {
        this.gameInProgress = false;
        this.audio.sfxWin();

        // Update scores
        if (data.scores) {
            for (const [id, score] of Object.entries(data.scores)) {
                const p = this.players.get(id);
                if (p) p.score = score;
            }
        }

        document.getElementById('winner-name').textContent = data.winnerName;
        document.getElementById('winner-score').textContent = `${WINNING_SCORE} points!`;

        const container = document.getElementById('final-scores');
        container.innerHTML = '';
        const sorted = Array.from(this.players.entries()).sort((a, b) => b[1].score - a[1].score);
        sorted.forEach(([id, p]) => {
            const row = document.createElement('div');
            row.className = 'final-score-row' + (id === data.winnerId ? ' winner' : '');
            row.innerHTML = `
                <span class="final-score-name">
                    <span class="score-dot" style="background:${p.color}"></span>
                    ${this._esc(p.name)}
                </span>
                <span class="score-pts">${p.score}</span>`;
            container.appendChild(row);
        });

        this._showScreen('gameover');
        this.audio.startMusic();
    }

    _playAgain() {
        if (this.isHost) {
            this.audio.stopMusic();
            this._startGame();
        }
    }

    _goHome() {
        this.gameInProgress = false;
        this.audio.stopMusic();
        if (this.net) { this.net.destroy(); this.net = null; }
        this.players.clear();
        this._showScreen('home');
    }

    // ---- UI HELPERS ----
    _updateScoreboard() {
        const sb = document.getElementById('scoreboard');
        sb.innerHTML = '';
        this.players.forEach((p) => {
            const item = document.createElement('div');
            item.className = 'score-item';
            let pips = '';
            for (let i = 0; i < WINNING_SCORE; i++) {
                pips += `<div class="score-pip${i < p.score ? ' filled' : ''}"></div>`;
            }
            item.innerHTML = `
                <span class="score-dot" style="background:${p.color}"></span>
                <span class="score-name">${this._esc(p.name)}</span>
                <span class="score-pts">${p.score}</span>
                <span class="score-bar">${pips}</span>`;
            sb.appendChild(item);
        });
    }

    _updatePlayersRing() {
        const ring = document.getElementById('players-ring');
        ring.innerHTML = '';
        const entries = Array.from(this.players.entries());
        const n = entries.length;
        const tableEl = document.getElementById('game-table');
        const tw = tableEl.offsetWidth || 340;
        const th = tableEl.offsetHeight || 340;
        const radius = tw * 0.45;

        entries.forEach(([id, p], i) => {
            const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
            const x = tw / 2 + Math.cos(angle) * radius;
            const y = th / 2 + Math.sin(angle) * radius;

            const el = document.createElement('div');
            el.className = 'ring-player';
            el.style.left = x + 'px';
            el.style.top = y + 'px';
            el.innerHTML = `
                <div class="ring-avatar" style="background:${p.color}">${this._esc(p.name[0]).toUpperCase()}</div>
                <div class="ring-name">${this._esc(p.name)}</div>
                <div class="ring-score">${p.score}</div>`;
            ring.appendChild(el);
        });
    }

    _esc(str) {
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }
}

// ===================== INIT =====================
const game = new Game();
