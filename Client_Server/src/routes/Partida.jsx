import React, {useEffect, useState, useRef, useContext, useMemo, memo} from 'react';
import memoize from 'memoize-one';
import {MenuBottom} from '../components/MenuBottom';
import { Tile } from '../class/class.jsx';
import "./Partida.css";
import { getNameUnitFromId, AllUnits } from '../class/units';
import { useNavigate, useParams } from 'react-router-dom';
import { SocketContext } from '../api/SocketProvider';

import { areEqual, FixedSizeGrid as Grid } from 'react-window';

import svgLoading from '../assets/loading.svg';
import Blocker from '../components/Blocker';

const JsonTiles = {
    mapSize: { w: 17, h: 10 },
    map:[
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
};

export default function Partida() {

    const navigate = useNavigate();
    const { RoomId } = useParams();
    const { socket } = useContext(SocketContext);

    // ===============================
    // All variables for the game
    const [settings, setSettings] = useState({
        mapSize: {w: 0, h: 0},
        me: { pos: 0},
        death: false,
        day: true,
    });
    const settingsRef = useRef(settings);
    settingsRef.current = settings;

    const [map, setMap] = useState([]);
    const mapRef = useRef(map);
    mapRef.current = map;

    const scrollMapRef = useRef(null);
    const scrollMapDarkRef = useRef(null);

    const [players, setPlayers] = useState([{name: "Someone"}]);

    const [waitingList, setWaitingList] = useState([0]);

    const [selection, setSelection] = useState({x: -1, y: -1});
    const selectionRef = useRef(selection);
    selectionRef.current = selection;

    const memoizedVarsTile = memoize((map, setMap, players, onClicks) => ({
        map,
        setMap,
        players,
        onClicks,
    }))

    // ===============================
    // All UI variables
    const menuBottomRef = useRef();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // setMap(JsonTiles.map);
        // setSettings({
        //     mapSize: JsonTiles.mapSize,
        //     me: 0,
        // });
        
        socket.emit("joinGameRoom", { RoomId : RoomId });

        socket.on("joinGameRoom", (data) => {

            if (data.joined){
                generateMap(data.moreData);
            } else {
                menuBottomRef.current.message("error", data.error);
                navigate("/");
            }
        });

        socket.on("updtGame", (data) => {
            setLoading(false);
            if ( data.error ){
                menuBottomRef.current.message("error", data.error);
            } else {
                const { type, subtype, moreData } = data;
                updateGameRoom[type][subtype](moreData);
            }

            // En el subtype 1, faltan case2 (no wait more), case3 (pause) y case4 (resume)
            // En el subtype 2, falta case1 (destroy unit)
        });

        return () => {
            socket.off("joinGameRoom");
            socket.off("updtGame");
        }

    }, []);

    const onScrollMap = (e) => {
        const { scrollLeft, scrollTop } = e;
        scrollMapDarkRef.current.scrollTo( scrollLeft, scrollTop );
    }

    const getNameUnit = (pos) => {
        return `${getNameUnitFromId(map[pos.y][pos.x].content.id)} (${pos.x+1},${pos.y+1})`;
    }

    // ===============================
    // Generacion de mapa
    const generateMap = (data) => {
        let { players, me, mapSize, map, waiting, waitingList } = data;

        menuBottomRef.current.message("info","Generando mapa...");
        setMap(map);

        setPlayers((prevPlayers) => {

            players.forEach((player) => {
                prevPlayers[player.id] = player.value;
            });
            return prevPlayers;
        });

        setSettings({mapSize: mapSize, me: me});
        setWaitingList(waitingList);
        setLoading(false);
    }

    const setSelectedUnit = (pos, value) => {
        setMap((prevMap) => {
            prevMap[pos.y][pos.x].content.anim.selected = value;
            return prevMap;
        });
    }

    const onClickUnit = (pos) => {
        if (loading) return;
        if (settings.death) return;

        const me = settings.me;
        const owner = map[pos.y][pos.x].info.ow;

        // Si la unidad no es mia y no es de mi equipo
        if (owner !== me) {
            if (players[owner].team !== players[me].team || players[owner].team === null ) {
                if (selection.x === -1) return; 

                const selectedUnit = map[selection.y][selection.x].content;
                if (true) {
                    if (selectedUnit.stats["Atk"]) {
                        // Si esta en rango de ataque
                        if (validateAtk(selection ,pos)){
                            setLoading(true);
                            socket.emit("updtGame", {type: 0, subtype: 1, moreData: {from: selection, to: pos}});
                        } else
                            menuBottomRef.current.message("error", 
                            getNameUnit(selection) +
                            "no esta en rango de ataque | RangeATK: "+ selectedUnit.stats.AtkRng.c);
                            
                    } else
                        menuBottomRef.current.message("error", 
                        getNameUnit(selection) + " no puede atacar");
                }
            }
            return;
        }

        if (selection.x !== -1){
            if (selection.x === pos.x && selection.y === pos.y){
                setSelection({x: -1, y: -1});
                setSelectedUnit(pos, false);
            } else {
                setSelection(pos);
                setSelectedUnit(pos, true);
            }
        } else {
            setSelection(pos);
            setSelectedUnit(pos, true);
        }
    }

    const onClickTile = (pos) => {
        if (loading) return;
        if (settings.death) return;
        if(map[pos.y][pos.x] == 0) 
            return;

        if (selection.x === -1) {
            if (map[pos.y][pos.x]?.type == 2 && map[pos.y][pos.x]?.owner == settings.me) {
                setSelection({x: pos.x, y: pos.y});
                return;
            }
        }
        else {
            if (selection.x === pos.x && selection.y === pos.y){
                setSelection({x: -1, y: -1});
                return;
            } else if (map[selection.y][selection.x]?.info?.type == 0) {

                const clickedUnit = map[selection.y][selection.x].content;
                // if (clickedUnit.stats.StpTm.c > 0){
                //     menuBottomRef.current.message("info",
                //         getNameUnit(selection) + " no puede moverse | Time: "+ clickedUnit.stats.StpTm.c);
                //     return;
                // }
        
                if (validateMov(selection, pos)) {
                    setLoading(true);
                    socket.emit("updtGame", {type: 0, subtype: 0, moreData: {from: selection, to: pos}});
                } else 
                    menuBottomRef.current.message("error", 
                        getNameUnit(selection) +
                        " no esta en rango de movimiento | Pasos: "+ clickedUnit.stats.Stp.c);
            }
        }
    }

    const onClicks = [
        onClickTile,
        onClickUnit,
    ];

    /** Renderiza la tile, junto con su contenido
     * @param {Object} data
     * @param {Number} columnIndex
     * @param {Number} rowIndex
     * @param {Object} style
     * @returns {JSX}
     */
    const getTile = memo(({ data, columnIndex, rowIndex, style }) => {
        if (!data?.map) return null;

        const { map, setMap, players, onClicks} = data;

        return (
            <Tile 
            key = {"Tile" + columnIndex + rowIndex}
            style = {style}
            tile = {map[rowIndex][columnIndex]}
            pos = {{x: columnIndex, y: rowIndex}}
            onClicks = {onClicks}
            players = {players}
            setMap = {setMap}
            />
        );

    }, areEqual);

    const ownedThingHasLigth = (tile) => {
        if (tile.info.type === 0)
            return tile.content?.stats?.Lum?.c;
        else
            return tile.content?.stats?.Lum?.c;
    }

    const globalThingHasLigth = (type, pos) => {
        return false
    }

    const renderLight = () => {
        // if (settings.death || map.length === 0) return null;

        // return map.map((row, i) => {
        //     return row.map((tile, j) => {
        //         let ligth = -1;

        //         if (tile["content"] !== undefined)
        //         if (tile?.info?.ow !== undefined)
        //         if (
        //             (players[settings.me].team !== null && 
        //             players[tile.info.ow].team === players[settings.me].team) ||
        //             tile.info.ow === settings.me
        //         ){
        //             let lum = ownedThingHasLigth(tile);
        //             if (lum) ligth = lum;
        //         } 
        //         //else if (tile.content.ow === -1)
        //         //     if (globalThingHasLigth(tile.content.type, tile.content.pos))

        //         return ligth >= 0 ? 
        //         <div
        //         key={`Luz${i}-${j}`}
        //         style={{
        //             width: "60px",
        //             height: "60px",
        //             borderRadius: "50%",
        //             boxShadow: `0 0 ${ligth}px ${ligth}px #ffffff`,
        //             backgroundColor: "white",
        //         }}/>
        //         : <div key={`Dark${i}-${j}`}/>

        //     })
        // })
    }
    // ===============================

    const areaValid = (pos, number) => (Math.abs(pos.from.x - pos.to.x) + Math.abs(pos.from.y - pos.to.y) > number)

    const validateMov = (from, to) => {
        const UnitSteps = map[from.y][from.x].content.stats.Stp.c;

        // If the tile is too far away, it is not valid
        return (!areaValid({from, to}, UnitSteps));
    }

    const validateAtk = (from, to) => {
        const UnitAtkRange = map[from.y][from.x].content.stats.AtkRng.c;

        return (!areaValid({from, to}, UnitAtkRange));
    }

    const deleteContentTile = (x, y, map) => {
        if (map[y][x]["owner"] !== undefined){
            map[y][x].content = null;
            map[y][x].info = null;
        }
        else
            map[y][x] = map[y][x].type;
    }

    // =====================================================================
    // Todas las acciones de movimiento, ataque, etc

    /** When the server ser the update "moveUnit" 
     * @param {Object} from - The tile where the unit is
     * @param {Object} to - The tile where the unit will be
     * @param {Object} posFrom - The position of the tile where the unit is
     * @param {Object} posTo - The position of the tile where the unit will be
     * @param {Object} anim - The animation variables
     */
    const moveUnit = (moreData) => {
        const { from, to, posFrom, posTo } = moreData;

        const fromx = parseInt(posFrom.x);
        const fromy = parseInt(posFrom.y);
        const tox = parseInt(posTo.x);
        const toy = parseInt(posTo.y);

        setPlayers(players => {
            let auxPlayers = [...players];

            auxPlayers[to.info.ow].units[to.info.pos] = posTo;

            // If the unit is mine, I update the position
            if (to.info.ow === settingsRef.current.me){
                if (fromx == selectionRef.current.x && fromy == selectionRef.current.y)
                    setSelection({x: tox, y: toy});
            }

            return auxPlayers;
        });

        setMap(map => {
            let auxMap = [...map];
            auxMap[fromy][fromx] = from;
            auxMap[toy][tox] = to;
            return auxMap;
        });
    }

    /** If You or any buy an upgrade, this function is called */
    const buyUpgrade = (moreData) => {
        const { idPlayer, pos, stat, value, lumty } = moreData;

        if (lumty !== undefined)
        setPlayers(players => {
            players[idPlayer].lumty = lumty;
            return players;
        });

        setMap(map => {
            map[pos.y][pos.x].content.stats[stat] = value;
            return map;
        });
    }

    /** An util function for create a new Unit, This function is used for
     * the server when someone buy a new unit, so i f you buyed a new unit
     * the lumty is updated
     */
    const createUnit = (moreData) => {
        const { infoTile, lumty, unit, pos } = moreData;
        const { ow } = infoTile;

        setPlayers(players => {
            let auxPlayers = [...players];
            auxPlayers[ow].units.push(pos);
            
            if (lumty !== undefined)
                auxPlayers[ow].lumty = lumty;

            return auxPlayers;
        });

        setMap(map => {
            let auxMap = [...map];
            auxMap[pos.y][pos.x].info = infoTile;
            auxMap[pos.y][pos.x].content = unit;
            return auxMap;
        });
    }

    /** Atacking a unit */
    const attackUnit = (moreData) => {
        const { from } = moreData;
        AllUnits[mapRef.current[from.y][from.x].info.id]
        .atack({
            me: settingsRef.current.me,
            setPlayers: setPlayers,
            setMap: setMap,
            deleteContentTile: deleteContentTile,
            setSettings: setSettings,
        }, moreData);
    }

    const onBuyUpgrade = (posU, stat) => {
        if (loading) return;
        if (settings.death) return;
        setLoading(true);
        socket.emit("updtGame", {type: 0, subtype: 2, moreData: {pos: players[settings.me].units[posU], stat: stat}});
    }

    const onBuyUnit = (id) => {
        if (loading) return;
        if (settings.death) return;
        setLoading(true);
        setSelection({x: -1, y: -1});
        socket.emit("updtGame", {type: 0, subtype: 3, moreData: {idUnit: id, pos: selection}});
    }

    /** an array with all the functions that are called when the server send a update */
    const updateGameRoom = [
        // GameMap
        [
            moveUnit,
            attackUnit,
            buyUpgrade,
        ],
        // GameStatus
        [
            (moreData) => setWaitingList(moreData.waitingList),
            (moreData) => setWaitingList(moreData.waitingList)
        ],
        // GameUtils
        [
            createUnit,
        ]
    ];

    return (<>
        <img
        className="Loading"
        src={svgLoading} 
        style={{
            display: loading ? "block" : "none",
            top: 10,
            left: 10,
        }}/>

        <div 
        className='MapRenderDark'
        ref={scrollMapDarkRef}
        style={{
            gridTemplateColumns: `repeat(${settings.mapSize.w}, 66px)`,
            gridTemplateRows: `repeat(${settings.mapSize.h}, 66px)`,
        }}>
            {renderLight()}
        </div>

        <Grid
        className='MapRender'
        ref={scrollMapRef}
        onScroll={onScrollMap}
        columnCount={settings.mapSize.w}
        columnWidth={66}
        height={450}
        rowCount={settings.mapSize.h}
        rowHeight={66}
        width={window.innerWidth}
        itemData={memoizedVarsTile(map, setMap, players, onClicks)}
        >
            {getTile}
        </Grid>

        <MenuBottom 
        ref={menuBottomRef}
        loading={loading}
        players={players}
        me={settings.me}
        death={settings.death}
        lumty={players[settings.me]?.lumty}
        onBuyUpgrade={onBuyUpgrade}
        onBuyUnit={onBuyUnit}
        selection={selection.x !== -1 ? 
            map[selection.y][selection.x]
            : null
        }
        />
        
        <Blocker
        deeps={[ waitingList.length != 0 ]}
        windows={[
            <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#19181a",
                padding: "20px",
                borderRadius: "10px",
                border: "5px solid rgb(0,140,255)",
                color: "white",
            }}>
                <h2>Estamos esperando a:</h2>
                {waitingList.map((item, index) => {
                    return (
                    <h2 key={"itemW"+index}>
                        {players[item]?.name}
                    </h2>)
                })}
            </div>
        ]}
        />
    </>);
}