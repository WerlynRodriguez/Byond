import express from 'express';
import morgan from 'morgan';
import { Server as SocketServer} from 'socket.io';
import http from 'http';
import cors from 'cors';

import { Puerto, IP } from './config.js';
import { Game } from "./classes/class.js";
import Player from './classes/player.js';
import User from "./classes/user.js";
import { eLogin } from './Errors.js';

const app = express();

const MaxActiveGames = 1;
let ActiveGames = 0;

/** All games in the server
 * @type {Map<string, Game>}
 */
const Games = new Map();

const PlayersPGame = {
    max: 8,
    min: 2
}

// Emulating a database
const MaxUsers = MaxActiveGames * PlayersPGame.max;
let NActiveUsers = 0;

/** All users in the server
 * @type {Map<string, User>}
 */
const Users = new Map();

const RoomsTypes = [
    "Lobby",
    "Custom",
    "Game"
]

// Create a server with express app and all configurations for socket.io
const server = http.createServer(app);
const io = new SocketServer(server, {
    cors: {
        origin: '*'
    }
});

// const getRoom = (idRoom) => {
//     return io.sockets.adapter.rooms.get(idRoom);
// }

// Morgan is a logger for write logs about requests
app.use(morgan('dev'));
app.use(cors());

// ==================== Utils ====================
// ================================================
const CheckNamePlayer = (name) => {
    if (Users.length <= 0) return -1;

    const index = Users.findIndex((user) => { return user.name === name });
    return index;
};

/** Validate the code of the client for join a game, with some rules
 * @param {string} path - The path of the client
 * @returns {boolean} true if the code is valid, false if not
 */
const validationCode = (path) => path.length >= 6 && path.length <= 12;

/** Add a new game to the list of games, no validations
 * @param {string} code - The code of the game
 * @param {Game} game - The game to add
 */
const AddNewGame = (code, game) => { Games.set(code, game) }

/** Get a game by the code
 * @param {string} code - The code of the game
 * @returns {Game} The game
 */
const GetGame = (code) => Games.get(code);

/** Remove a Game from the list of games, no validations
 * @param {string} code - The code of the game
 */
const RemoveGame = (code) => {
    console.log(`Game ${code} ${Games.delete(code) ? "removed" : "not removed"}`); 
}

/** Add a new player to the list of players, no validations
 * @param {string} name - The name of the player
 * @param {User} player - The player to add
 */
const AddNewPlayer = (name, player) => {
    Users.set(name, player);
}

/** Get a player by the name
 * @param {string} name - The name of the player
 * @returns {User} The player
 */
const GetPlayer = (name) => Users.get(name);

/** Remove a player from the list of players, no validations
 * @param {string} name - The name of the player
 */
const RemovePlayer = (name) => {
    Users.delete(name);
}

// When a client connects to the server
io.on('connection', (socket) => {
    console.log(`New connection: ${socket.id}`);

    /**
     * @type {string | null} The name of the socket */
    let socketName = null;

    /**
     * @type {string | null} The token for create a game */
    let socketTokenCreate = null;

    /**
     * @type {{ code: string, pPos: number } | null} The info of the game
     */
    let socketInfoGame = null;


    // ==================== Login ====================
    /** Login the client or reconnect it
     * @param {User} user - The user to login
     * @param {string} name - The name of the client
     * @param {string} path - The path of the client
     */
    const Login = (user, name, path) => {
        user.online = true;
        user.id = socket.id;
        socketName = name;

        NActiveUsers++;
        socket.emit('Login', { id: socket.id, name: name });
        console.log(`Client connected: ${name}`);
    };

    socket.on('Login', (data) => {
        const { PlayerName, PlayerID, PlayerPass, PlayerPath } = data;

        if (NActiveUsers >= MaxUsers) {
            socket.emit('Login', { error: eLogin.MaxUsers });	
            return;
        }

        let newPlayer = GetPlayer(PlayerName);

        // If the client has an id, it means that it is reconnecting
        if (PlayerID != null) {
            if (newPlayer == undefined) {
                socket.emit('Login', { error: eLogin.NotFound });
                console.log(`Client not found: ${PlayerName}`);
                return;
            }

            if (newPlayer.id != PlayerID) {
                socket.emit('Login', { error: eLogin.NotFound });
                console.log(`Client not found: ${PlayerName} playerId: ${newPlayer.id} != ${PlayerID}`);
                return;
            }

            if (newPlayer.online) {
                socket.emit('Login', { error: eLogin.Conected });
                console.log(`Client already connected: ${PlayerName}`);
                return;
            }
        } else if (newPlayer) { // Log in or create a new user

            if (newPlayer.online) {
                socket.emit('Login', { error: eLogin.Conected });
                return;
            }

            if (newPlayer.pass != PlayerPass){
                socket.emit('Login', { error: eLogin.BadPass });
                return;
            }

        } else {
            // New user
            newPlayer = new User(
                socket.id,
                PlayerPass,
                true,
                "",
            )
            AddNewPlayer(
                PlayerName, 
                newPlayer
            );
        }

        Login(newPlayer, PlayerName, PlayerPath);
    });


    // ====================== GAME ====================
    // ================================================
    socket.on('createGame', () => {

        if (Games.size >= MaxActiveGames) {
            socket.emit('createGame', { error: 'Maximo de partidas alcanzado' });
            return;
        }

        const codeGame = socketName + Math.random().toString(36).substring(2, 5);
        socketTokenCreate = codeGame;

        // Send the game id to the client
        socket.emit('createGame', { id: codeGame });
        socket.leave("Lobby");
    });

    //==================== WAIT ROOM ========================
    const updateWaitRoom = [
        /** 0 - Create a new team
         * @param {Game} waitRoom - The wait room
         */
        (waitRoom, moreData) => {
            const resolve = waitRoom.createTeam(socketInfoGame.pPos);
            if (resolve.error) return resolve;

            io.to("WR-"+socketInfoGame.code).emit('updateWaitRoom', {
                type: 0,
                pIndex: socketInfoGame.pPos,
                moreData: {
                    idTeam: resolve,
                    teams: waitRoom.teams
                }
            })
            return;
        },
        /** 1 - Leave a team
         * @param {Game} waitRoom - The wait room
         */
        (waitRoom, moreData) => {
            const resolve = waitRoom.leaveTeam(socketInfoGame.pPos);
            if (resolve.error) return resolve;

            io.to("WR-"+socketInfoGame.code).emit('updateWaitRoom', {
                type: 1,
                pIndex: socketInfoGame.pPos,
                moreData: {
                    teams: waitRoom.teams
                }
            })
            return;
        },
        /** 2 - Join a team
         * @param {Game} waitRoom - The wait room
         */
        (waitRoom, moreData) => {
            const resolve = waitRoom.joinTeam(socketInfoGame.pPos, moreData.idTeam);
            if (resolve.error) return resolve;

            io.to("WR-"+socketInfoGame.code).emit('updateWaitRoom', {
                type: 2,
                pIndex: socketInfoGame.pPos,
                moreData: {
                    idTeam: moreData.idTeam,
                    teams: waitRoom.teams
                }
            })
            return;
        },
        /** 3 - User join
         * @param {Game} waitRoom - The wait room
         */
        (waitRoom, moreData) => {
            socket.to("WR-"+socketInfoGame.code).emit('updateWaitRoom', { 
                type: 3,
                pIndex: socketInfoGame.pPos,
                moreData: {
                    name: socketName,
                    color: waitRoom.players.get(socketInfoGame.pPos).color,
                    team: null,
                    colors: waitRoom.colors,
                    countPlayers: waitRoom.players.size
                }
            });
            return;
        },
        /** 4 - User leave
         * @param {Game} waitRoom - The wait room
         */
        (waitRoom, moreData) => {
            socket.leave("WR-"+socketInfoGame.code);

            const resolve = waitRoom.removePlayer(socketInfoGame.pPos);
            if (resolve == -1) { 
                waitRoom.endGame();
                return; 
            }

            socket.to("WR-"+socketInfoGame.code).emit('updateWaitRoom', {
                type: 4,
                pIndex: socketInfoGame.pPos,
                moreData:{
                    Owner: resolve,
                    teams: waitRoom.teams,
                    colors: waitRoom.colors,
                    countPlayers: waitRoom.players.size
                }
            });
            socketInfoGame = null;
            return;
        },
        /** 5 - Change color
         * @param {Game} waitRoom - The wait room
         */
        (waitRoom, moreData) => {
            const resolve = waitRoom.changeColorPlayer(socketInfoGame.pPos, moreData.color);
            if (resolve.error) return resolve;

            io.to("WR-"+socketInfoGame.code).emit('updateWaitRoom', {
                type: 5,
                pIndex: socketInfoGame.pPos,
                moreData: {
                    color: moreData.color,
                    colors: waitRoom.colors
                }
            });
            return;
        },
        /** 6 - Start Generation game
         * @param {Game} waitRoom - The wait room
         */
        (waitRoom, moreData) => {
            const resolve = waitRoom.validateTeams();
            if (resolve.error) return resolve;

            io.to("WR-"+socketInfoGame.code).emit('updateWaitRoom', { type: 6 });

            const resolve2 = waitRoom.generateMap();
            if (resolve2.error) return resolve2;

            io.to("WR-"+socketInfoGame.code).emit('updateWaitRoom', { type: 7 });
            io.in("WR-"+socketInfoGame.code).socketsLeave("WR-"+socketInfoGame.code);
            return;
        }
    ]

    socket.on('joinWaitRoom', (data) => {
        const { code } = data; // RoomId example: "Bestoabc"
        
        if (!validationCode(code)) {
            socket.emit('joinWaitRoom', { error: 'Codigo invalido' });
            return;
        }

        const gameRoom = GetGame(code);
        if (gameRoom == undefined) { // If the game does not exist
            if (!socketTokenCreate) {
                socket.emit('joinWaitRoom', { error: 'No existe la partida' });
                
            } else if (socketTokenCreate != code){
                socketTokenCreate = null;
                socket.emit('joinWaitRoom', { error: 'No deberia suceder esto' });

            } else {
                AddNewGame(
                    code,
                    new Game(
                        code,
                        socketName,
                        PlayersPGame.max,
                        io,
                        RemoveGame,
                    )
                );

                socketInfoGame = {
                    code: code,
                    pPos: 0
                };

                socket.join("WR-"+code);
                socket.emit('joinWaitRoom', { created: true, name: socketName });
            }

            return;
        }

        if (gameRoom.playing) {
            socket.emit('joinWaitRoom', { error: 'La partida ya ha comenzado' });
            return;
        }

        if (gameRoom.id != code) {
            socket.emit('joinWaitRoom', { error: 'No se ha encontrado la partida' });
            return;
        }

        // Check if the game is full
        const resolve = gameRoom.addPlayer(socketName);
        if (resolve == false) {
            socket.emit('joinWaitRoom', { error: 'La partida esta llena' });
            return;
        }

        socket.join("WR-" + code);
        socket.emit('joinWaitRoom', { 
            joined: true, 
            pos: resolve, 
            players: gameRoom.getPlayersRW(),
            teams: gameRoom.teams,
            colors: gameRoom.colors,
            moreData:{
                Owner: gameRoom.owner,
                countPlayers: gameRoom.players.size
            }
        }); 
        socketInfoGame = {
            code: code,
            pPos: resolve
        };
        updateWaitRoom[3](gameRoom, null);

    });

    socket.on('updateWaitRoom', (data) => {
        const { type, moreData} = data;
        if (socketInfoGame == null) return;

        const resolve = updateWaitRoom[type](GetGame(socketInfoGame.code), moreData);
        if (resolve?.error) socket.emit('updateWaitRoom', resolve);

    });

    //============== GAME ROOM ==================
    const updateGameRoom = [
        // =========
        // Game Map
        // =========
        [
            /** 0 - Move unit
             * @param {Game} gameRoom */
            (gameRoom, moreData) => {
                const resolve = gameRoom.moveUnit(moreData.from, moreData.to);
                if (resolve.error) return resolve;

                io.to("GR-" + gameRoom.id).emit('updtGame', {
                    type: 0,
                    subtype: 0,
                    moreData: resolve
                });
                return;
            },
            /** 1 - Attack unit
             * @param {Game} gameRoom */
            (gameRoom, moreData) => {
                const resolve = gameRoom.atackUnit(moreData.from, moreData.to);
                if (resolve.error) return resolve;

                io.to("GR-" + gameRoom.id).emit('updtGame', {
                    type: 0,
                    subtype: 1,
                    moreData: resolve
                });
                return;
            },
            /** 2 - Upgrade unit
             * @param {Game} gameRoom */
            (gameRoom, moreData) => {
                const resolve = gameRoom.upgradeUnit(socketInfoGame.pPos, moreData.pos, moreData.stat);
                if (resolve.error) return resolve;

                socket.emit('updtGame', {
                    type: 0,
                    subtype: 2,
                    moreData: {
                        idPlayer: socketInfoGame.pPos,
                        pos: resolve.pos,
                        stat: resolve.stat,
                        value: resolve.value,
                        lumty: resolve.lumty
                    }
                });
                if (resolve.basicInfo)
                    socket.broadcast.to("GR-" + gameRoom.id).emit('updtGame', {
                        type: 0,
                        subtype: 2,
                        moreData: {
                            pos: resolve.pos,
                            stat: resolve.stat,
                            value: resolve.basicInfo,
                        }
                    });
                return;
            },
            /** 3 - Buy unit
             * @param {Game} gameRoom */
            (gameRoom, moreData) => {
                const resolve = gameRoom.buyUnit(socketInfoGame.pPos, moreData.idUnit, moreData.pos);
                if (resolve.error) return resolve;

                socket.emit('updtGame', {
                    type: 2,
                    subtype: 0,
                    moreData: {
                        infoTile: resolve.infoTile,
                        lumty: resolve.lumty,
                        unit: resolve.fullInfoUnit,
                        pos: moreData.pos
                    }
                });
                socket.broadcast.to("GR-" + gameRoom.id).emit('updtGame', {
                    type: 2,
                    subtype: 0,
                    moreData: {
                        infoTile: resolve.infoTile,
                        unit: resolve.basicInfoUnit,
                        pos: moreData.pos
                    }
                });
                return;
            },
        ],
        // ===========
        // Game Status
        // ===========
        [
            /** 0 - User Join or reconnect 
             * @param {Game} gameRoom */
            (gameRoom, moreData) => {
                gameRoom.reconnectPlayer(moreData.indexP);
                socket.to("GR-" + gameRoom.id).emit('updtGame', {
                    type: 1,
                    subtype: 0,
                    moreData: {
                        waitingList: gameRoom.waitingList
                    }
                });
                return;
            },
            /** 1 - User exit 
             * @param {Game} gameRoom */
            (gameRoom, moreData) => {
                if (gameRoom.disconectPlayer(moreData.indexP)) {
                    gameRoom.endGame();
                } else {
                    socket.to("GR-" + gameRoom.id).emit('updtGame', {
                        type: 1,
                        subtype: 0,
                        moreData: {
                            waitingList: gameRoom.waitingList
                        }
                    });
                }
                return;
            },
        ]
    ];

    /** When th owner of the game is in the game room, he can start the game
     * every player will be redirected to the game room, and the game will starting
     * There are 3 status:
     * 0: Waiting for players ( when the owner click start game )
     * 1: Playing
     * 2: Waiting for someone player who exit the game
     */
    socket.on("joinGameRoom", (data) => {
        const { RoomId } = data;

        if (!validationCode(RoomId)) {
            socket.emit('joinGameRoom', { error: 'El código de la partida no es válido' });
            console.log('El código de la partida no es válido ' + RoomId);
            return;
        }

        const gameRoom = GetGame(RoomId);
        if (gameRoom == undefined) {
            socket.emit('joinGameRoom', { error: 'No se ha encontrado la partida' });
            console.log('No se ha encontrado la partida ' + RoomId);
            return;
        }

        if (gameRoom.id != RoomId) {
            socket.emit('joinGameRoom', { error: 'No se ha encontrado la partida' });
            console.log('No se ha encontrado la partida ' + RoomId + ' ' + gameRoom.id);
            return;
        }

        //Check if the player is in the waiting list
        if (gameRoom.waitingList.length <= 0) {
            socket.emit('joinGameRoom', { error: 'La partida ya ha comenzado' });
            console.log('La partida ya ha comenzado ' + gameRoom.waitingList.length);
            return;
        }

        // Check if the player is in the list of players
        let playerIndex = undefined;
        for (const [index, player] of gameRoom.players) {
            if (player.name == socketName) {
                playerIndex = index;
                break;
            }
        }
        if (playerIndex == undefined) {
            socket.emit('joinGameRoom', { error: 'No formas parte de esta partida' });
            console.log('No formas parte de esta partida ' + socketName);
            return;
        }

        socketInfoGame = {
            code: RoomId,
            pPos: playerIndex,
        }

        updateGameRoom[1][0](gameRoom, {indexP: playerIndex});
        socket.join("GR-" + RoomId);

        socket.emit('joinGameRoom', { 
            joined: true, 
            moreData: {
                players: gameRoom.getPlayersRG(playerIndex),
                me: playerIndex,
                mapSize: gameRoom.map.config.size, 
                map: gameRoom.map.map,
                waitingList: gameRoom.waitingList,
            }
        });
    });

    socket.on('updtGame', (data) => {
        const { type, subtype, moreData } = data;

        const resolve = updateGameRoom[type][subtype](GetGame(socketInfoGame.code), moreData);
        if (resolve?.error) socket.emit('updtGame', resolve );
    });
    // ===============================================================================================

    const disconnect = () => {
        if (!socketName) return false;

        console.log(`Client disconnected: ${socketName}`);
        GetPlayer(socketName).online = false;
        NActiveUsers--;
        return true;
    }

    //When a client logs out
    socket.on("Logout", (data) => {

        disconnect()
        socket.emit('Logout', { ok: true })
        socket.leave("Lobby")
    });

    // When a client disconnects from the server
    socket.on('disconnect', () => {

        if(!disconnect()) return;
        if (!socketInfoGame) return;

        const game = GetGame(socketInfoGame.code);
        if (game == undefined) return;

        if (game.playing)
            updateGameRoom[1][1](game, {indexP: socketInfoGame.pPos});
        else
            updateWaitRoom[4](game, null);

    });
});

server.listen(Puerto, IP, () => {
    console.log('Example app listening on ' + IP + ':' + Puerto);
});