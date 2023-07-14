import { Unit } from "./units.js";
import { AllUnits } from "./units.js";

export default class Player {
    /** Inclued infromation while stay in wait room and in game room
     * @param {Number} num - The number of the player in the array of players
     * @param {String} name - The name of the player
     * @param {Number} color - The index color of the player
     */
    constructor(num, name, color) {
        /** @type {Number} */
        this.num = num;

        /** @type {String} */
        this.name = name;

        /** @type {Number} */
        this.color = color;

        /** @type {Number | null} */
        this.team = null;

        /** @type {Number} */
        this.lumty = 1000;

        /** @type {Array<{x: Number, y: Number}>} */
        this.units = [];

        /** @type {Array<Number>} */
        this.stepTimes = [];

        /** If you are dead and you are in the game room maybe you are spectating 
         * @type {Boolean} */
        this.death = false;
    }
    
    /** Set the color of the player
     * @param {Number} color - The index color of the player */
    setColor(color) { this.color = color; }

    /** Set the team of the player
     * @param {Number} team - The index team of the player */
    setTeam(team) { this.team = team; }

    clockIteration(time, map) {
        if (this.stepTimes.length <= 0) return;

        this.stepTimes.forEach((PosU, index) => {

            if (this.units[PosU] == undefined) { //
                console.log("Error: PosU is undefined");
                this.stepTimes.splice(index, 1);
            } else {
                /** @type {Unit} */
                let unit = map[this.units[PosU].y][this.units[PosU].x]?.content;
                if (unit){
                    if (unit.clockIteration(time))
                        this.stepTimes.splice(index, 1);
                } else
                    this.stepTimes.splice(index, 1);
            }
        });
    }

    /** Add a new unit at last position
     * @param {{x: Number, y: Number}} pos - The position of the unit in the map
     */
    addUnit(pos) {
        this.units.push(pos);
    }

    /** Remove a unit from the array of units
     * @param {Number} pos - The position of the unit in the array of units */
    lostUnit(pos) { this.units.splice(pos, 1); }

    canBuyUnit(id, pos){
        if (this.lumty < AllUnits[id].price)
            return { error: "Lumtys insuficientes" }

        if (this.units.length >= 5)
            return { error: "No hay mas espacio" }

        this.lumty -= AllUnits[id].price;
        this.addUnit(pos);
        return this.units.length - 1;
    }

    /** Return full info of the player if the index is the same of the player
     * else basic info of the player and units */
    getInfoInGame(index) {

        if (index == this.num) {
            return {
                name: this.name,
                color: this.color,
                team: this.team,
                lumty: this.lumty,
                units: this.units,
            }
        } else {
            return {
                name: this.name,
                color: this.color,
                team: this.team,
                units: this.units
            }
        }
    }
}