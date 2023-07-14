import Player from "./player.js";

/** The store is a collection of all the prizes in units or structures
 * This prizes are for upgrade stats of units or structures
 * @param {int} 0: cant to add or substract to the current stat
 * @param {int} 1: Percentage to add to prize
 * @param {string} 2: asc or dsc, asc for ascending and dsc for descending
 */ 
export const Store = {
    units: {
        Hp:[2, 40, "asc", 50],
        Stp:[1, 60, "asc", 8],
        StpTm:[0.5, 55, "dsc", 3],
        Atk:[1, 40, "asc", 20],
        Lum:[20, 30, "asc", 400],
    }
}

export class Unit {
    /** The class father of all the units
     * @param {Number} id - The id of the unit
     * @param {Object} stats - The stats of the unit
     * @param {Object} anim - The animation of the unit */
    constructor(
        id = 0,
        stats = {
            Hp: { c:25, m: 25, s: 20 },
            Stp: { c: 1, m: 1, s: 10 },
            StpTm: { c: 0, m: 1.0, s: 10 },
            Atk: { c: 1.0, m: 1.0, s: 10 },
            AtkRng: { c: 1, m: 1, s: 10 },
        },
        anim = {
            rot: 0,
            selected: false,
            moved: false, // Boolean or Object {x: 0, y: 0} (from)
        }
    ) {
        this.id = id;
        this.stats = stats;
        this.anim = anim;
    }

    /** Function to calculate the damage in base of the max damage and the max hp */
    getDmgHp() { return (this.stats.Hp.c * this.stats.Atk.m) / this.stats.Hp.m; }

    /** Function to random make a crit attack
     * @param {Number} atk - The damage of the attack */
    getDmgCrit(atk) {
        // 30% chance to make a crit attack
        // If yes, 80% of 1.5x damage, 15% of 2x damage, 5% of 2.5x damage
        const crit = Math.random() * 100;
        if (crit < 30) {
            const critDmg = Math.random() * 100;
            if (critDmg < 80) return atk * 1.5;
            if (critDmg < 95) return atk * 2;
            return atk * 2.5;
        }
        return atk;
    }

    /** Function to make every iteration of the clock
     * @param {number} time - The time to move the unit
     * @returns {boolean} - Return true if the unit not have more time to move */
    clockIteration(time) {
        this.stats.StpTm.c -= time;
        if (this.stats.StpTm.c <= 0) {
            this.stats.StpTm.c = 0;
            return true;
        }
        return false;
    }

    /** Function to get the basic info of the unit */
    getBasicInfo() {
        return {
            id: this.id,
            stats: {
                Hp: { c: this.stats.Hp.c },
                StpTm: { m: this.stats.StpTm.m },
            },
            anim: this.anim,
        }
    }

    /** The function to get the full info of the unit */
    getFullInfo() {
        return {
            id: this.id,
            stats: this.stats,
            anim: this.anim,
        }
    }

    move(from, to, map, players, utils) {

    }

    /** Function to upgrade a stat of the unit
     * @param {string} stat: stat to upgrade
     * @param {int} money: money of the player
     * @returns {{error: string | {stat: {c: int, m: int, s: int}}}} error if 
     * the player can't upgrade the stat, or the new stat if the player can upgrade the stat */
    upgradeStat(stat, money){
        const prize = this.stats[stat].s;

        if (Store.units[stat][2] == "asc") {
            if (this.stats[stat].m >= Store.units[stat][3]) return { error: "Maximo alcanzado" }
            if (money < prize) return { error: "Lumtys insuficientes" }

            if (this.stats[stat].c == this.stats[stat].m) // If the stat is full, add the prize to the max
                this.stats[stat].c += Store.units[stat][0];

            this.stats[stat].m += Store.units[stat][0];

        } else {
            if (this.stats[stat].m <= Store.units[stat][3]) return { error: "Maximo alcanzado" }
            if (money < prize) return { error: "Lumtys insuficientes" }

            if (this.stats[stat].c == this.stats[stat].m)
                this.stats[stat].c -= Store.units[stat][0];

            this.stats[stat].m -= Store.units[stat][0];
        }

        // Calcule next prize= stats[stat].s + Store.units[stat][1]%
        this.stats[stat].s += Math.round((this.stats[stat].s * Store.units[stat][1]) / 100);

        return this.getBasicInfo().stats[stat]
    }

    /** Function to receive damage and check if the unit is dead
     * @param {int} dmg: damage to receive
     * @returns {boolean} true if the unit is dead, false if not
     */
    receiveAttack(dmg) {
        this.stats.Hp.c -= dmg;
        if (this.stats.Hp.c <= 0) {
            this.stats.Hp.c = 0;
            return { dead: true }
        }

        if (this.stats["Atk"])
            this.stats.Atk.c = this.getDmgHp();
            
        return { dmg: dmg }
    }

    /** Function to attack to another unit
     * @param {{x: int, y: int}} from: position of the unit that attack
     * @param {{x: int, y: int}} to: position of the unit that receive the attack
     * @param {Array<Array<Tile>>} map: map of the game
     * @param {Map<int, Player>} players: players of the game
     * @param {function} deleteContentTile: function to delete the content of a tile
     * @returns {{from: {x: int, y: int}, to: {x: int, y: int}, resolveRA: {dmg: int, dead: boolean}}} 
     * resolveRA: result of the attack to the unit */
    attack(from, to, map, players, deleteContentTile) {
        const { ow: owT, pos: posT } = map[to.y][to.x].info;
        const { ow: owF, pos: posF } = map[from.y][from.x].info;
        let damage = this.getDmgCrit(this.stats.Atk.c);

        const auxPAtack = players.get(owF);
        if (auxPAtack == undefined) return {error: "No existe el jugador"};
        if (auxPAtack.death) return {error: "El jugador esta muerto"};

        const auxPReceive = players.get(owT);
        const resolveRA = map[to.y][to.x].content.receiveAttack(damage);
        if (resolveRA.dead) {
            if (map[to.y][to.x].info.id == 0){
                auxPReceive.death = true;
            }
            auxPReceive.lostUnit(posT);
            deleteContentTile(to.x, to.y, map);
        }

        // Loose turn
        this.stats.StpTm.c = this.stats.StpTm.m;
        auxPAtack.stepTimes.push(posF);

        return {
            from: from,
            to: to,
            resolveRA: resolveRA
        }
    }
    /** Function to get the damage of the unit */
    doSuper() {

    }
}

/** Class Fari extends unit, and adds a new property to stats.
 * The new property is Lum, which is the amount of light the unit emits */
export class Fari extends Unit {
    constructor(
        stats = {
            Hp: { c: 20, m: 20, s: 30 },
            Stp: { c: 2, m: 2, s: 60 },
            StpTm: { c: 0, m: 6.0, s: 55 },
        }
    ) {
        super(0, stats);
        this.stats.Lum = { c: 50, m: 50, s: 30 };
    }

    getBasicInfo() {
        return {
            id: this.id,
            stats: {
                Hp: this.stats.Hp,
                Lum: this.stats.Lum,
            },
            anim: this.anim,
        }
    }
}

export class Soldi extends Unit {
    constructor(
        stats = {
            Hp: { c: 10, m: 10, s: 20 },
            Stp: { c: 1, m: 1, s: 40 },
            StpTm: { c: 0, m: 2.0, s: 25 },
            Atk: { c: 2.0, m: 2.0, s: 30 },
            AtkRng: { c: 1, m: 1, s: null },
        }
    ) {
        super(1, stats);
    }
}

export class Master extends Unit {
    constructor(
        stats = {
            Hp: { c: 15, m: 15, s: 25 },
            Stp: { c: 1, m: 1, s: 60 },
            StpTm: { c: 0, m: 7.0, s: 55 },
            Atk: { c: 4.0, m: 4.0, s: 55 },
            AtkRng: { c: 4, m: 4, s: null },
        }
    ) {
        super(2, stats);
    }
}

export class Yasb extends Unit {
    constructor(
        stats = {
            Hp: { c: 25, m: 25, s: 40 },
            Stp: { c: 1, m: 1, s: 60 },
            StpTm: { c: 0, m: 8.0, s: 50 },
            Atk: { c: 5.0, m: 5.0, s: 60 },
            AtkRng: { c: 1, m: 1, s: null },
        }
    ) {
        super(3, stats);
    }
}

export class Ochi extends Unit {
    constructor(
        stats = {
            Hp: { c: 12, m: 12, s: 30 },
            Stp: { c: 2, m: 2, s: 60 },
            StpTm: { c: 0, m: 6.0, s: 60 },
            AtkRng: { c: 1, m: 1, s: null },
        }
    ) {
        super(4, stats);
    }
}

export class Runder extends Unit {
    constructor(
        stats = {
            Hp: { c: 6, m: 6, s: 20 },
            Stp: { c: 3, m: 3, s: 65 },
            StpTm: { c: 0, m: 4.0, s: 60 },
            Atk: { c: 1.5, m: 1.5, s: 35 },
            AtkRng: { c: 1, m: 1, s: null },
        }
    ) {
        super(5, stats);
    }
}

export class Besto extends Unit {
    constructor(
        stats = {
            Hp: { c: 8, m: 8, s: 25 },
            Stp: { c: 2, m: 2, s: 60 },
            StpTm: { c: 0, m: 5.0, s: 55 },
            Atk: { c: 2.8, m: 2.8, s: 30 },
            AtkRng: { c: 1, m: 1, s: null },
        }
    ) {
        super(6, stats);
    }
}

export class Krackxel extends Unit {
    constructor(
        stats = {
            Hp: { c: 10, m: 10, s: 50 },
            Stp: { c: 1, m: 1, s: 60 },
            StpTm: { c: 0, m: 20.0, s: 55 },
            Atk: { c: 2.0, m: 2.0, s: 60 },
            AtkRng: { c: 1, m: 1, s: null },
        }
    ) {
        super(7, stats);
    }
}

export const AllUnits = [
    {
        Class : Fari,
        price: 0,
    },
    {
        Class : Soldi,
        price: 20,
    },
    {
        Class : Master,
        price: 60,
    },
    {
        Class : Yasb,
        price: 100,
    },
    {
        Class : Ochi,
        price: 80,
    },
    {
        Class : Runder,
        price: 40,
    },
    {
        Class : Besto,
        price: 60,
    },
    {
        Class : Krackxel,
        price: 130,
    }
]

// Fari + Soldi = Solfar
// Fari + Master = Faster
// Fari + Yasb = Faryas
// Fari + Ochi = Ochari
// Fari + Runder = Ranfer
// Fari + Besto = Besfor
// Fari + Krackxel = Frakxel

// Soldi + Master = Soldaster
// Soldi + Yasb = Yasolb
// Soldi + Ochi = Sochi
// Soldi + Runder = Sonder
// Soldi + Besto = Bestoldi
// Soldi + Krackxel = Kroldi

// Master + Yasb = Yasbter
// Master + Ochi = Motchi
// Master + Runder = Munder
// Master + Besto = Bamster
// Master + Krackxel = Macker

// Yasb + Ochi = Yosbi
// Yasb + Runder = Ryaber
// Yasb + Besto = Yabsto
// Yasb + Krackxel = Yackxel

// Ochi + Runder = Ondech
// Ochi + Besto = Bestochi
// Ochi + Krackxel = Ockxil

// Runder + Besto = Brunter
// Runder + Krackxel = Krundel

//=============================
// Fusionadora de MASAS (ESTRUCTURA)
// Esta estructura fusiona todas las unidades

// Fari + Soldi + Master + Yasb + Ochi + Runder + Besto + Krackxel = Cataclysmo

