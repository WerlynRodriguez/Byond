import React, { useEffect, useState } from 'react';
import { useSpring, animated } from '@react-spring/web'
import "./class.css";
import ColorsPallete from './colors';

// boxShadow: props.ow.t === props.player.t ? 
//             '0 0 10px #fff, 0 0 20px #fff, 0 0 30px #fff, 0 0 40px #ffffff, 0 0 70px #ffffff, 0 0 80px #ffffff, 0 0 100px #ffffff, 0 0 150px #a307a3' 

/** Render unit
 * @param {Object} props
 */
export function RenderUnit (props) {
    const { info, content, players, pos, setMap } = props;
    const { rot, selected, moved } = content.anim;
    const [spring, setSpring] = useState(null);

    const anims = useSpring(spring);

    useEffect(() => {
        if (spring) return;

        if (moved){
            setSpring({
                from: { 
                    x: moved.x,
                    y: moved.y,
                    width: AllUnits[info.id].size.w,
                    height: AllUnits[info.id].size.h,
                    boxShadow: '1px 22px 43px 0px rgba(15,109,138,0)'
                },
                to: [
                    { 
                        width: AllUnits[info.id].size.w + 20,
                        height: AllUnits[info.id].size.h + 20,
                        boxShadow: '1px 22px 43px 0px rgba(15,109,138, 1)'
                    },
                    { 
                        x: 0,
                        y: 0,
                    },
                    { 
                        width: AllUnits[info.id].size.w,
                        height: AllUnits[info.id].size.h,
                        boxShadow: '1px 22px 43px 0px rgba(15,109,138, 0)'
                    },
                ],
                config: {
                    ...AllUnits[info.id].config,
                    tension: 200, 
                    friction: 20 
                },
                onRest: () => { 
                    setSpring(null)
                    setMap((prevMap) => {
                        const newMap = [...prevMap];
                        newMap[pos.y][pos.x].content.anim.moved = false;
                        return newMap;
                    });
                },
            });
        } else if (selected){
            setSpring({
                from: { 
                    x: 0,
                    y: 0,
                },
                to: { 
                    x: 0,
                    y: -5,
                },
                config: {
                    duration: 250,
                    ...AllUnits[info.id].config
                },
                loop: { reverse: true },
            });
        }
    }, [spring]);

    return (
        <animated.div
        className={'Unit ' + AllUnits[info.id].name}
        style={{
            ...anims,
            rotate: rot,
            border: '4px solid ' + ColorsPallete[players[info.ow].color],
        }}/>
    );
}

function looseTurn(map, pos){
    map[pos.y][pos.x].content.stats.StpTm.stc = map[pos.y][pos.x].content.stats.StpTm.m
}

//=======================Comuns=====================
const attackComun = (utils, moreData) => {
    const { me, setPlayers, setMap, deleteContentTile, setSettings } = utils;
    const { from, to, resolveRA } = moreData;

    setMap((prevMap) => {

        // if ( me == prevMap[from.y][from.x].content.info.ow)
        // looseTurn(prevMap, from);

        AllUnits[prevMap[to.y][to.x].info.id].recAtk(utils, moreData, prevMap);

        return prevMap;
    });
}

const recAtkComun = (utils, moreData, map) => {
    const { me, setPlayers, setMap, deleteContentTile, setSettings } = utils;
    const { from, to, resolveRA } = moreData;

    if ( resolveRA.dead ){
        if ( me == map[to.y][to.x].info.ow)
            if ( map[to.y][to.x].info.id == 0 )
                setSettings((prevSettings) => {
                    prevSettings.death = true;
                    return prevSettings;
                });

        deleteContentTile(to.x, to.y, map);
    }
    else{
        map[to.y][to.x].content.stats.Hp.c -= resolveRA.dmg;
    }

}

//=======================Fari=======================
const attackFari = (utils, moreData) => {}
const superFari = ({setMap}) => {}

//=======================Soldi=======================
const superSoldi = ({setMap}) => {}

//=======================Master=======================
const attackMaster = (utils, moreData) => {}
const superMaster = ({setMap}) => {}

//=======================Yasb=======================
const attackYasb = (utils, moreData) => {}
const superYasb = ({setMap}) => {}

//=======================Ochi=======================
const attackOchi = (utils, moreData) => {}
const superOchi = ({setMap}) => {}

//=======================Runder=======================
const attackRunder = (utils, moreData) => {}
const superRunder = ({setMap}) => {}

//=======================Besto=======================
const attackBesto = (utils, moreData) => {}
const superBesto = ({setMap}) => {}

//=======================Krackxel=======================
const attackKrackxel = (utils, moreData) => {}
const superKrackxel = ({setMap}) => {}

// ALL UNITS
export const AllUnits = [
    {
        name: 'Fari',
        render: RenderUnit,
        size: { w: 40, h: 40 },
        config: {mass: 2, precision: 0.2},
        price: 0,
        atack: attackFari,
        recAtk: recAtkComun,
        doSuper: superFari,
    },
    {
        name: 'Soldi',
        render: RenderUnit,
        size: { w: 40, h: 40 },
        config: {mass: 2, precision: 0.2},
        price: 20,
        atack: attackComun,
        recAtk: recAtkComun,
        doSuper: superSoldi,
    },
    {
        name: 'Master',
        render: RenderUnit,
        size: { w: 45, h: 45 },
        config: {mass: 4, precision: 0.5},
        price: 60,
        atack: attackMaster,
        recAtk: recAtkComun,
        doSuper: superMaster,
    },
    {
        name: 'Yasb',
        render: RenderUnit,
        size: { w: 50, h: 50 },
        config: {mass: 5, precision: 0.8},
        price: 100,
        atack: attackYasb,
        recAtk: recAtkComun,
        doSuper: superYasb,
    },
    {
        name: 'Ochi',
        render: RenderUnit,
        size: { w: 42, h: 42 },
        config: {mass: 2, precision: 0.2},
        price: 80,
        atack: attackOchi,
        recAtk: recAtkComun,
        doSuper: superOchi,
    },
    {
        name: 'Runder',
        render: RenderUnit,
        size: { w: 35, h: 35 },
        config: {mass: 1, precision: 0.1},
        price: 40,
        atack: attackRunder,
        recAtk: recAtkComun,
        doSuper: superRunder,
    },
    {
        name: 'Besto',
        render: RenderUnit,
        size: { w: 45, h: 45 },
        config: {mass: 3, precision: 0.3},
        price: 60,
        atack: attackBesto,
        recAtk: recAtkComun,
        doSuper: superBesto,
    },
    {
        name: 'Krackxel',
        render: RenderUnit,
        size: { w: 45, h: 45 },
        config: {mass: 3, precision: 0.3},
        price: 130,
        atack: attackKrackxel,
        recAtk: recAtkComun,
        doSuper: superKrackxel,
    },
];

export const getNameUnitFromId = (id) => {
    return AllUnits[id].name;
}