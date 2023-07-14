import getMap from "../allMaps/allMaps.js";

export class Mapa {
    /** @param {number} idMap - The id of the map */
    constructor(idMap = 0) {
        this.id = idMap;
        /** @type {number[][]} */
        this.map = [];

        /** @type {{size: {w: number, h: number}, infoPos: {swTs: {x: number, y: number}[][], faris: {type: number, selected: {x: number, y: number}[]}}}} */
        this.config = {};
    }

    generate() {
        const allMaps = getMap(this.id);
        this.map = allMaps.map;
        this.config = allMaps.config;
    }
}