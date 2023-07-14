export class Tile {
    constructor(
        info = {
            ow: 0, // Owner of the content
            type: 0, // Type of the content
            id: 0, // Id of the content
            pos: 0 // Position of the content in the array of item
        },
        content = null,
        type = 1
    ) {
        this.info = info;
        this.type = type;
        this.content = content;
    }
}
// Spawn Tile (Green Tile for summon units)
export class SpawnTile extends Tile {
    constructor(
        owner = 0,
        info = null,
        content = null
    ) {
        super(info, content, 2);

        this.owner = owner;
    }
}