
export default class User{
    /** The class of the player
     * @param {string} id - The id of the socket
     * @param {string} pass - The password of the player
     * @param {boolean} online - If the player is online
     * @param {{ code: string, pPos: number } | null} room The info of the game
     */
    constructor(id, pass, online, room){
        this.id = id;
        this.pass = pass;
        this.online = online;
        this.room = room;
    }

    update(updatedProps){
        for (const prop in updatedProps)
            this[prop] = updatedProps[prop];
    }
}