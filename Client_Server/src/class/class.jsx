import React from 'react';
import './class.css';
import "./badge.css";
import { AllUnits, RenderUnit } from './units.jsx';

// Tiles
const tiles = [
    { key: "empty", classN: "tEmpty" },
    { key: "comun", classN: "tComun" },
    { key: "sumon", classN: "tSumon" },
]

const RenderTypes = [
    AllUnits,
]

/** Return the render of a tile, with or not a content
 * @param {tile} tile: the tile
 * @param {pos} pos: the position of the tile
 * @param {color} color: the color of the owner
 * @param {content} content: the content of the tile (unit, structure, etc)
 * @param {onClicks} onClicks: the array of functions that will be called when the tile is clicked
 */
export function  Tile(props) {
    const { tile, pos, style, onClicks, players, setMap } = props;
    const {x, y} = pos; // x and y of the tile

    const key = tile["type"] ? 
        tiles[tile.type].key + x + "t" + y : 
        tiles[tile].key + x + "t" + y;

    const classN = tile["type"] ?
        tiles[tile.type].classN :
        tiles[tile].classN;

    if (tile["content"] && tile?.content !== null) 
    return (
        <div
        key={key}
        className={'tile ' + classN}
        style={{
            position: "absolute",
            top: style.top,
            left: style.left,
        }}
        onClick={() => onClicks[tile.info.type + 1](pos)}
        type="button"
        badge={"1"}
        data-after-text={tile.content.stats.Hp.c}
        data-after-type="darkgray badge bottom right"
        >
            {
                RenderTypes[tile.info.type][tile.info.id].render({
                    info: tile.info,
                    content: tile.content,
                    players: players,
                    pos: pos,
                    setMap: setMap,
                })
            }
        </div>
    )

    return (
        <div 
        key={key}
        className={'tile ' + classN}
        style={{
            position: "absolute",
            top: style.top,
            left: style.left,
        }}
        onClick={() => onClicks[0](pos)}
        type="button"
        />
    );
}