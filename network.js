'use strict';

// ===================== NETWORK LAYER =====================
class GameNetwork {
    constructor(onMessage, onPlayerJoin, onPlayerLeave, onError) {
        this.peer = null;
        this.connections = new Map(); // peerId -> DataConnection
        this.onMessage = onMessage;
        this.onPlayerJoin = onPlayerJoin;
        this.onPlayerLeave = onPlayerLeave;
        this.onError = onError;
        this.isHost = false;
        this.hostConn = null; // client's connection to host
    }

    generatePin() {
        return String(Math.floor(10000 + Math.random() * 90000));
    }

    // HOST: create game and listen for connections
    createGame(pin) {
        return new Promise((resolve, reject) => {
            const peerId = PEER_PREFIX + pin;
            this.isHost = true;
            this.peer = new Peer(peerId, { debug: 0 });

            this.peer.on('open', (id) => {
                resolve(id);
            });

            this.peer.on('connection', (conn) => {
                this._setupHostConnection(conn);
            });

            this.peer.on('error', (err) => {
                if (err.type === 'unavailable-id') {
                    reject(new Error('PIN already in use. Try again.'));
                } else {
                    reject(err);
                }
            });
        });
    }

    _setupHostConnection(conn) {
        conn.on('open', () => {
            this.connections.set(conn.peer, conn);
        });

        conn.on('data', (data) => {
            if (data.type === 'join') {
                this.onPlayerJoin(conn.peer, data.name);
            }
            this.onMessage(data, conn.peer);
        });

        conn.on('close', () => {
            this.connections.delete(conn.peer);
            this.onPlayerLeave(conn.peer);
        });

        conn.on('error', (err) => {
            console.error('Connection error:', err);
            this.connections.delete(conn.peer);
            this.onPlayerLeave(conn.peer);
        });
    }

    // CLIENT: connect to host
    connectToHost(pin) {
        return new Promise((resolve, reject) => {
            this.isHost = false;
            this.peer = new Peer(undefined, { debug: 0 });

            this.peer.on('open', () => {
                const hostId = PEER_PREFIX + pin;
                const conn = this.peer.connect(hostId, { reliable: true });
                this.hostConn = conn;

                conn.on('open', () => {
                    resolve(this.peer.id);
                });

                conn.on('data', (data) => {
                    this.onMessage(data, 'host');
                });

                conn.on('close', () => {
                    this.onError('Host disconnected');
                });

                conn.on('error', (err) => {
                    reject(new Error('Failed to connect to game'));
                });
            });

            this.peer.on('error', (err) => {
                if (err.type === 'peer-unavailable') {
                    reject(new Error('Game not found. Check the PIN.'));
                } else {
                    reject(err);
                }
            });

            // Timeout after 10s
            setTimeout(() => {
                if (!this.hostConn || !this.hostConn.open) {
                    reject(new Error('Connection timed out'));
                }
            }, 10000);
        });
    }

    // HOST: send to all connected peers
    broadcast(data) {
        this.connections.forEach((conn) => {
            if (conn.open) conn.send(data);
        });
    }

    // HOST: send to specific peer
    sendTo(peerId, data) {
        const conn = this.connections.get(peerId);
        if (conn && conn.open) conn.send(data);
    }

    // CLIENT: send to host
    sendToHost(data) {
        if (this.hostConn && this.hostConn.open) {
            this.hostConn.send(data);
        }
    }

    destroy() {
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }
        this.connections.clear();
        this.hostConn = null;
    }

    get myId() {
        return this.peer ? this.peer.id : null;
    }
}
