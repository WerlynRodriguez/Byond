export default function getMap(idMap) {
    switch (idMap) {
        case 0:
            return {
                config : {
                    size : { w : 17, h : 10 },
                    infoPos : {
                        // Spawn Tiles for each player. The first array is the spawn tiles for the first player
                        // Inside this array, all positions are the spawn tiles for this player
                        swTs :[
                            [{x: 0, y: 0}],
                            [{x: 16, y: 0}],
                            [{x: 16, y: 9}],
                            [{x: 0, y: 9}],
            
                            [{x: 4, y: 0}],
                            [{x: 12, y: 0}],
                            [{x: 12, y: 9}],
                            [{x: 4, y: 9}]
                        ],
                        /** Spawn for Faris, each player. Type:
                        * 0 = Aleatory position in the spawn tiles
                        * 1 = First position in the spawn tiles
                        * 2 = Selected position in the spawn tiles (in this case no need to add the selected array) */
                        faris: {
                            type: 1,
                            selected:[]
            
                        }
                    }
                },
                map: [
                    [  1,  1,  0,  1,  1,  1,  1,  0,  1,  1,  1,  0,  1,  0,  1,  1,  1],
                    [  1,  1,  0,  1,  1,  1,  1,  1,  0,  1,  1,  1,  1,  0,  1,  1,  1],
                    [  1,  1,  0,  0,  1,  1,  1,  0,  1,  0,  1,  1,  0,  1,  0,  1,  1],
                    [  1,  1,  1,  0,  1,  1,  0,  0,  0,  0,  0,  1,  1,  1,  1,  1,  1],
                    [  0,  1,  1,  0,  1,  1,  1,  1,  1,  1,  0,  1,  1,  1,  1,  1,  1],
                    [  1,  1,  1,  1,  1,  1,  0,  1,  1,  1,  1,  1,  1,  0,  1,  0,  1],
                    [  1,  1,  1,  1,  1,  1,  0,  0,  0,  0,  0,  1,  1,  0,  1,  1,  1],
                    [  1,  1,  1,  1,  1,  1,  1,  0,  1,  0,  1,  1,  0,  0,  1,  1,  1],
                    [  1,  1,  0,  0,  1,  1,  1,  1,  0,  1,  1,  1,  0,  1,  1,  1,  1],
                    [  1,  1,  1,  1,  1,  1,  1,  1,  0,  1,  1,  1,  1,  0,  1,  1,  1]
                ]
            }
        default:
            return null;
    }
}