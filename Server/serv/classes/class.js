import { Mapa } from "./maps.js";
import { SpawnTile, Tile } from "./tiles.js";
import { Unit, Fari, AllUnits } from "./units.js";
import Player from "./player.js";

/** Calculate the distance between 2 points referent a step
 * @param {any} pos - The position of the unit
 * @param {number} pos.from - The position from
 * @param {number} pos.to - The position to
 * @param {Number} number - The number of steps
 * @returns {Boolean} - True if the distance is greater than the number of steps
 * @example
 * const pos = {
 * from: { x: 0, y: 0 },
 * to: { x: 1, y: 1 }
 * }
 * const number = 1
 * areaValid(pos, number) // true
 */
const areaValid = (pos, number)=> (Math.abs(pos.from.x - pos.to.x) + Math.abs(pos.from.y - pos.to.y) > number)

/** Calculate the rotation of a unit depending of 
 * the position of the unit and the position of the target
 * @param {any} from - The position of the unit
 * @param {any} to - The position of the target
 * @returns {Number} - The rotation in degrees
 * @example
 * const from = { x: 0, y: 0 }
 * const to = { x: 1, y: 1 }
 * getRotation(from, to) // 45
 */
const getRotation = (from, to) =>(Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI + 90);

/** Get the position in Left and Top of the unit
 * @param {any} from - The last position of the unit
 * @param {any} to - The new position of the unit
 * @returns {any} - The position in Left and Top
 * @example
 * const from = { x: 0, y: 0 }
 * const to = { x: 1, y: 1 }
 * getFrom(from, to) // { x: 60, y: 60 }
 */
const getFrom = (from, to) => {
    const size = 60;
    const gap = 3;

    const distanceX = from.x - to.x;
    const distanceY = from.y - to.y;
    
    return {
        x: (distanceX * size) + (distanceX * gap),
        y: (distanceY * size) + (distanceY * gap)
    }
}

export class Game {
    /** The game class is the main class of the game
     * @param {String} id - The code of the game
     * @param {String} FirstPlayer - The name of the first player
     * @param {Number} maxPlayers - The max number of players
     * @param {SocketIO.Server} io - The socket io server
     * @param {Function} deleteGame - The function to delete the game
     */
    constructor(id, FirstPlayer, maxPlayers = 8, io, deleteGame) {

        /** The code of the game
         * @type {String}
         * @example
         * "Bestoabc"
         */
        this.id = id;

        /** The id of the owner of the game
         * @type {Number} */
        this.owner = 0;

        /** @type {Map<number, Player>} */
        this.players = new Map();
        this.players.set(0, new Player(0, FirstPlayer, 0));

        /** Availables ids of players
         * @type {Array<Number>} 
         * @example
         * [1, 2, 3, 4, ..., maxPlayers] */
        this.idsPlayers = Array.from({ length: maxPlayers - 1 }, (_, i) => i + 1);
        
        /** The teams is an array of arrays, each array is a team,
         * with the positions of the players in the array of players
         * @type {Array<Array<Number>>} */
        this.teams = [];

        /** The color are the ids of the colors availables (1 - 9)
         * @type {Array<Number>} */
        this.colors =Array.from({ length: 9 }, (_, i) => i + 1);

        /** The owner in the wait room, can select de id of the map
        * When the player start the game, the map generate
        * With randoms structures and randoms positions
        * @type {Mapa} */
        this.map = new Mapa(0);

        /** The game clock is the clock of the game, when the game is started 
         * this variable will contain the interval of the game.
         * When the game is stopped, this variable will be null
         * @type {NodeJS.Timer | null} */
        this.gameClock = null;

        // Time to day is 6 minutes in seconds = 360
        this.timetoEnd = 10;
        this.timeToDay = 10;

        /** Playing is true when the game is started
         * Waiting is true when a player leave the game while is playing 
         * Playing: false, Waiting: X (Are in the Waiting Room 
         * Playing: true, Waiting: 0 (Are in the Game Room)
         * Playing: true, Waiting: > 0 (Are in Game Room waiting for reconnect a player) 
         * @type {Boolean} */
        this.playing = false;

        /** @type {Array<Number>} - The array of players in the waiting room */
        this.waitingList = [];

        /** @type {SocketIO.Server} - The socket io server */
        this.io = io;
        this.deleteGame = deleteGame;
    }

    /** Change the color for a player
     * @param {Number} idPlayer - The id of the player
     * @param {Number} color - The id of the color
     * @returns {Boolean | {error: String}} - True if the color is changed, or error
     */
    changeColorPlayer(idPlayer, color) {
        const auxPlayer = this.players.get(idPlayer);
        if (!auxPlayer) return { error: "El jugador no existe" };

        const lastColor = auxPlayer.color;
        
        //Check if the color is in the array of colors
        let index = this.colors.indexOf(color);
        if (index == -1) return { error: "El color no está disponible" };

        // Change the color of the player
        auxPlayer.setColor(color);

        // Delete the new color of the array of colors
        this.colors.splice(index, 1);

        // Add the last color of the player in the array of colors
        this.colors.push(lastColor? lastColor : 0);
        return true;
    }

    /**Method when a player join in the room game
    * Return true if the player is added and false 
    * if the game is full
    * @param {String} name - The name of the player
    * @returns {Number | boolean} - The id of the player or false if the game is full
    */
    addPlayer(name){
        if (this.idsPlayers <= 0) return false;

        const index = this.idsPlayers.shift();
        if (index == undefined) return false;

        this.players.set(
            index, 
            new Player(
                index, 
                name, 
                this.colors.shift()
            )
        );
        return index;
    }

    /**Method when a player exit the game
     * @param {Number} idPlayer - The id of the player
     * @returns {Number} - The id of the new owner or -1 if the game have 1 player or less
    */
    removePlayer(idPlayer){
        if (this.players.size <= 1) return -1;

        const auxPlayer = this.players.get(idPlayer);
        if (auxPlayer == undefined) return -1;

        this.colors.push(auxPlayer.color);

        if (auxPlayer.team != null) this.leaveTeam(idPlayer);
        
        this.idsPlayers.push(idPlayer);
        this.players.delete(idPlayer);

        if (this.owner == idPlayer) {
            // Search the new owner
            for (const [key, value] of this.players) {
                this.owner = key;
                break;
            }
        }
        return this.owner;
    }

    /** When a user disconect Return true if all players are disconnected
     * @param {Number} idPlayer - The id of the player
     * @returns {Boolean} - True if all players are disconnected
    */
    disconectPlayer(idPlayer) {
        if (this.waitingList.length + 1 == this.players.size) return true; //All players are disconnected

        this.waitingList.push(idPlayer);

        if (this.gameClock != null) clearInterval(this.gameClock);
        return false;
    }

    /** When a user is disconnected, the game is waiting for reconnect
     * @param {Number} idPlayer - The id of the player
     * @returns {Boolean} - True if all players are reconnected
     */
    reconnectPlayer(idPlayer) {
        if (this.waitingList.length - 1 == 0) { //All players are reconnected
            this.waitingList = [];

            this.gameClock = setInterval(() => {
                this.clockIteration(1);
            }, 1000);

            return true;
        }

        let index = this.waitingList.indexOf(idPlayer);
        if (index != -1) this.waitingList.splice(index, 1); //Delete the player of the waiting list
        return false;
    }

    /** Add a new team from a player pos 
     * @param {Number} idPlayer - The id of the player
     * @returns {Number | {error: string}} - The id of the team or an object with the error
     */
    createTeam(idPlayer) {
        const auxPlayer = this.players.get(idPlayer);

        if (auxPlayer == undefined) return { error: "El jugador no existe" };
        if (auxPlayer.team != null) return { error: "Ya estas en un equipo" }

        let index = 0;

        while (this.teams[index] != null) index++;

        auxPlayer.setTeam(index);
        this.teams[index] = [idPlayer];

        const team = auxPlayer.team;

        return team;
    }

    /** Remove a player from a team 
     * @param {Number} idPlayer - The id of the player
     * @returns {Boolean | {error: string}} - The id of the team or an object with the error
     */
    leaveTeam(idPlayer) {
        const auxPlayer = this.players.get(idPlayer);

        if (auxPlayer == undefined) return { error: "El jugador no existe" };
        if (auxPlayer.team == null) return { error: "No estas en un equipo" }

        let idTeam = auxPlayer.team
        auxPlayer.setTeam(null);

        if ( this.teams[idTeam] == null) return { error: "El equipo no existe" }

        // If the team is empty, delete the team
        if (this.teams[idTeam]?.length == 1) {
            this.teams[idTeam] = null;
        } else {
            let index = this.teams[idTeam]?.indexOf(idPlayer);
            this.teams[idTeam]?.splice(index ? index : 0, 1);
        }

        return true;
    }

    /** Add a player to a team
     * @param {Number} idPlayer - The id of the player
     * @param {Number} idTeam - The id of the team
     * @returns {Boolean | {error: string}} - The id of the team or an object with the error
     */
    joinTeam(idPlayer, idTeam) {
        const auxPlayer = this.players.get(idPlayer);

        if (auxPlayer == undefined) return { error: "El jugador no existe" };
        if (auxPlayer.team != null) return { error: "Ya estas en un equipo" }
        if (this.teams[idTeam] == null) return { error: "El equipo no existe" }

        const TeamLength = this.teams[idTeam]?.length;
        if (TeamLength >= 7) return { error: "El equipo esta lleno" }

        auxPlayer.setTeam(idTeam);

        this.teams[idTeam].push(idPlayer);
        return true;
    }

    /** Method when a player join in the wait room
    * Send all the players in the wait room
    * @returns {Array} - An array of all players in the wait room 
    */
    getPlayersRW(){
        let nplayers = [];

        for (const [key, value] of this.players) {
            nplayers.push({
                id: key,
                value: {
                    name: value.name, 
                    color: value.color, 
                    team: value.team
                }
            });
        }
        return nplayers;
    }

    /** Give all information about all players, depending for the player 
     * @param {Number} indexPlayer - The id of the player
     * @returns {Array} - An array of all players in the game
    */
    getPlayersRG(indexPlayer){
        let nplayers = [];

        for (const [key, value] of this.players) {
            nplayers.push({
                id: key,
                value: value.getInfoInGame(indexPlayer)
            });
        }

        return nplayers;
    }

    /** Method when a player join in the wait room
    * Send all the teams in the game
    * @returns {Array} - An array of all teams in the game
    */
    getTeamsRW(){
        let nteams= [];
        this.teams.forEach(team => {
            if (team != null) nteams.push(team.players);
        });
        return nteams;
    }

    /** When a player play start the game, validate the teams
     * All teams number must be bigger than 1 and less than 8
     * I validate the number of players in the game... maybe for hackers
     * @returns {Boolean} - True if the teams are valid
     * @todo - Validate the number of players in the game
     * @todo - Validate the number of players in the team
     * @todo - Validate the number of teams
     */ 
    validateTeams(){
        if (this.players.size < 2 || this.players.size > 8) return false;

        if (this.teams.length !== 0) {
            if ( this.teams.some((team) => team?.length === 1 || team?.length === this.players.size) ) return false;
        }
        
        return true;
    }

    //=========================================================
    //===================== GAME METHODS ======================
    //=========================================================
    /** When a player play start the game, generate the map
     * @returns {Boolean} - True if the map is generated
     */
    generateMap(){
        this.playing = true;
        this.waitingList = new Array(this.players.size).fill(0).map((_, i) => i); // [0, 1, 2, 3, 4, 5, 6, 7]

        this.map.generate();

        // Suffle spawntiles
        this.map.config.infoPos.swTs.sort(() => Math.random() - 0.5);
        let SumonTPos = this.map.config.infoPos.swTs;

        // Put the Summon tiles
        for (let i = 0; i < this.players.size; i++)
            SumonTPos[i].forEach((pos) => this.map.map[pos.y][pos.x] = new SpawnTile(i));

        // Put Faris depending of the type
        switch (this.map.config.infoPos.faris.type) {
            case 0:
                break;
            case 1:
                for (const [key, auxPlayer] of this.players) {

                    const newUnit = new Fari();
                    auxPlayer.addUnit({x: SumonTPos[key][0].x, y: SumonTPos[key][0].y});

                    this.map.map[SumonTPos[key][0].y][SumonTPos[key][0].x] = 
                        new SpawnTile(
                            key,
                            {
                                ow: key,
                                type: 0,
                                id: 0,
                                pos: 0
                            },
                            newUnit
                        )
                }
                break;
            default:
                break;
        }

        // Logic about the structures but later
        // ================================
        return true;
    }

    endGame(){
        if (this.clockIteration != null) 
            clearInterval(this.clockIteration);

        for (const [key, auxPlayer] of this.players) 
            this.players.delete(key);

        this.deleteGame(this.id);
    };

    clockIteration(time){
        for (const [key, auxPlayer] of this.players) {
            auxPlayer.clockIteration(time, this.map.map);
        }
    }

    /** Function to delete any content in a tile
     * @param {Number} x - The x position of the tile
     * @param {Number} y - The y position of the tile
     */
    deleteContentTile(x, y, map){
        if (map[y][x]["owner"] !== undefined){
            map[y][x].content = null;
            map[y][x].info = null;
        }
        else
            map[y][x] = map[y][x].type;
    }

    /** Function to set any content in a tile
     * @param {Number} x - The x position of the tile
     * @param {Number} y - The y position of the tile
     * @param {Object} content - The content of the tile
     * @param {Object} info - The info of the tile
     * @param {Array} map - The map of the game
     * @todo - Validate the content and info */
    setContentTile(x, y, content, info, map){
        if (map[y][x]["owner"] !== undefined){
            map[y][x].info = info;
            map[y][x].content = content;
        }
        else
            map[y][x] = new Tile(info, content, map[y][x].type);
    }

    /** When a player move own unit
     * @param {{x: Number, y: Number}} from - The position of the unit
     * @param {{x: Number, y: Number}} to - The position to move
     * @returns {Boolean | any} - If the unit can move, return all info needed to move the unit
     */
    moveUnit(from, to){
        const tileTo = this.map.map[to.y][to.x] // number or a json tile 
        if (tileTo?.content != null) return {error: "Esta ocupado"};

        const tileFrom = this.map.map[from.y][from.x];
        const info = tileFrom.info;
        let unit = tileFrom.content;

        if (unit == null) return {error: "No existe la unidad"};
        if (unit.stats.StpTm.c > 0) return {error: "No te puedes mover"};
        if (areaValid({from, to}, unit.stats.Stp.c)) return {error: "Fuera de rango"};

        const auxPlayer = this.players.get(info.ow);
        if (auxPlayer == undefined) return {error: "No existe el jugador"};
        if (auxPlayer.death) return {error: "El jugador esta muerto"};

        unit.stats.StpTm.c = unit.stats.StpTm.m; // Set the unit can't move
        auxPlayer.units[info.pos] = {x: to.x, y: to.y}; // Update the unit position
        auxPlayer.stepTimes.push(info.pos); // Add the unit to the step times

        // ==== ANIMATION ====
        const rot = getRotation(from, to);
        const AnimFrom = getFrom(from, to);
        unit.anim.rot = rot;
        unit.anim.moved = AnimFrom;

        // If the tile have an property called ow, it's a spawn tile
        this.deleteContentTile(from.x, from.y, this.map.map);

        this.setContentTile(to.x, to.y, unit, info, this.map.map);

        auxPlayer.units[info.pos].pos = to;

        return {
            from: this.map.map[from.y][from.x], 
            to: this.map.map[to.y][to.x], 
            posFrom: from, 
            posTo: to,
        };
    }

    /** When a player upgrade own unit
     * @param {number} idPlayer - The id of the player
     * @param {number} pos - The pos of the unit ( if exists )
     * @param {string} stat - The stat to upgrade
     * @returns {Boolean | any} - If the unit can upgrade, return all info needed to upgrade the unit
     */
    upgradeUnit(idPlayer, pos, stat){
        const unit = this.map.map[pos.y][pos.x].content;

        if (unit == null) return {error: "No existe la unidad"}; // If the unit doesn't exist
        if (this.map.map[pos.y][pos.x].info.ow != idPlayer) 
        return {error: "No es tuya la unidad " + this.map.map[pos.y][pos.x].info.ow + " " + idPlayer};

        const auxPlayer = this.players.get(idPlayer);
        if (auxPlayer == undefined) return {error: "No existe el jugador"};
        if (auxPlayer.death) return {error: "El jugador esta muerto"};

        const prize = unit.stats[stat].s;
        const resolve = unit.upgradeStat(stat, auxPlayer.lumty);

        if (resolve?.error)
            return resolve;
        else{
            auxPlayer.lumty -= prize;
            return {
                pos: pos,
                stat: stat,
                lumty: auxPlayer.lumty,
                value: unit.stats[stat],
                basicInfo: resolve
            }
        }
    }

    /** When a player buy a new unit in the shop
     * @param {number} idPlayer - The id of the player
     * @param {number} idUnit - The id of the unit
     * @returns {Boolean | any} - If the unit can buy, return all info needed to buy the unit
     */
    buyUnit(idPlayer, idUnit, pos){
        if (this.map.map[pos.y][pos.x]?.content != null) return {error: "Espacio ocupado"}; // If the tile is not empty
        if (this.map.map[pos.y][pos.x]?.type != 2) return {error: "No es un tile de tienda"}; // If the tile is not empty

        const auxPlayer = this.players.get(idPlayer);
        if (auxPlayer == undefined) return {error: "No existe el jugador"};
        if (auxPlayer.death) return {error: "El jugador esta muerto"};

        const resolve = auxPlayer.canBuyUnit(idUnit, pos);
        if (resolve.error) return resolve;

        const newUnit = new AllUnits[idUnit].Class();

        this.map.map[pos.y][pos.x].info = 
        {
            ow: idPlayer,
            type: 0,
            id: idUnit,
            pos: resolve
        }
        this.map.map[pos.y][pos.x].content = newUnit;


        return {
            infoTile: this.map.map[pos.y][pos.x].info,
            lumty: auxPlayer.lumty,
            fullInfoUnit: newUnit.getFullInfo(),
            basicInfoUnit: newUnit.getBasicInfo(),
        }
    }

    /** When an unit try to atack 
     * @param {{x: Number, y: Number}} from - The position of the unit
     * @param {{x: Number, y: Number}} to - The position to atack
     * @returns {Boolean | any} - If the unit can atack, return all info needed to atack the unit
    */
    atackUnit(from, to) {
        const tileTo = this.map.map[to.y][to.x] // number or a json tile with content
        if (tileTo?.content == null) return { error: "No hay nadie para atacar" } // If the tile is not empty

        const tileFrom = this.map.map[from.y][from.x];
        if (tileFrom?.content == null) return { error: "No hay nadie atacando" } // If the tile is not empty

        const unitFrom = this.map.map[from.y][from.x].content;

        if (unitFrom == null) return { error: "No hay nadie atacando" } // If the unit still exist
        if (unitFrom.stats.StpTm.c > 0) return {error: "No te puedes mover aún"}; // If the unit can't move

        return unitFrom.attack(
            from, 
            to, 
            this.map.map, 
            this.players, 
            this.deleteContentTile);
    }

    /** When a player die */
    validateEndGame(){
        
    }
}