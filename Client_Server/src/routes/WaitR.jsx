import React,{useEffect, useState, useContext, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from 'rc-toastr';
import { SocketContext } from '../api/SocketProvider';
import ColorsPallete from '../class/colors';
import Blocker from '../components/Blocker';

import svgExit from '../assets/exit.svg';
import svgComunity from '../assets/comunity.svg';
import svgPaint from '../assets/paint.svg';
import svgSettings from '../assets/settings.svg';
import svgExitTm from '../assets/exitTm.svg';
import svgEnterTm from '../assets/enterTm.svg';
import svgStart from '../assets/start.svg';
import svgLoading from '../assets/loading.svg';

import "../components/Components.css";
import "../components/DesignFaris.css";

const MaxPlayers = 8;

function GetPlayer(props){
    const { keyName, index, player, Me } = props;
    const { name, color } = player;
    const { ownerPos, pos } = Me;

    return (
    <div 
    key={keyName+index}
    className='BasicFari'
    style={{ 
        borderColor: ColorsPallete[color],
        width: "40px",
        height: "40px",
    }}>
        <div style={{
            color: index === pos ? "green" : "",
        }}> 
            { (index === ownerPos ? "*" : "") + name } 
            </div>
        <div/>
    </div>
    )
}

export default function WaitR(props){
    const { RoomId } = useParams();
    const { toast } = useToast();
    const { socket } = useContext(SocketContext);
    const navigate = useNavigate();

    const [Me, setMe] = useState({pos: 0, ownerPos:0, owner: true});

    const [countPlayers, setCountPlayers] = useState(1);

    const [ Players, setPlayers ] = useState(new Array(MaxPlayers));

    const [Teams, setTeams] = useState([]);

    const [loading, setLoading] = useState(true);

    const [MyPalette, setMyPalette] = useState([ 1, 2, 3, 4, 5, 6, 7, 8, 9 ]);
    const [showPallet, setShowPallet] = useState(false);

    useEffect(() => {
        socket.emit("joinWaitRoom", { code : RoomId });

        socket.on("joinWaitRoom", (data) => {
            const { created, joined, error } = data;
            setLoading(false);

            if (created) {
                setPlayers((prevPlayers) => {
                    prevPlayers[0] = ({ name: data.name, color: 0, team: null });
                    return prevPlayers;
                });
                return;

            } else if (joined) {
                const { pos, players, teams, colors, moreData } = data;
                const { Owner, countPlayers } = moreData;

                setPlayers((prevPlayers) => {

                    players.forEach((player) => {
                        prevPlayers[player.id] = player.value;
                    });
                    return prevPlayers;
                });

                setMe({pos: pos, ownerPos:Owner, owner: false});
                setCountPlayers(countPlayers);
                setTeams(teams);
                setMyPalette(colors);
                return;
            }

            toast.error(error);
            navigate("/");
        });

        socket.on("updateWaitRoom", (data) => {
            const { type, pIndex, moreData, error} = data;

            if (error) 
                toast.error(error);
            else 
                updateWaitRoom[type](pIndex, moreData);
            setLoading(false);
        });

        return () => {
            socket.off("joinWaitRoom");
            socket.off("updateWaitRoom");
        }

    }, []);

    // ==============================================================
    // Top Bar Functions ============================================
    // ==============================================================
    /** When a user click in the button to exit the room */
    const onExit = () => {
        if (loading) return;

        socket.emit("updateWaitRoom", { type: 4});
        navigate("/");
    }

    const onSelectColor = (indexC) => {
        if (loading) return;

        setLoading(true);
        socket.emit("updateWaitRoom", { type: 5, moreData: { color: indexC }});
    }

    // ==============================================================
    // WaitR Functions ==============================================
    // ==============================================================
    
    const onJoinUser = (pos, { name, color, colors, countPlayers }) => {
        setPlayers((prevPlayers) => {
            prevPlayers[pos] = { name: name, color: color, team: null };
            return prevPlayers;
        });

        setMyPalette(colors)
        setCountPlayers(countPlayers);
    }

    const onLeaveUser = (pos, { Owner, colors, countPlayers, teams }) => {

        setPlayers((prevPlayers) => {
            prevPlayers[pos] = null;
            return prevPlayers;
        });
        setTeams(teams)
        setMe((prevMe) => {
            prevMe.ownerPos = Owner;
            prevMe.owner = prevMe.pos === Owner;
            return prevMe;
        });
        setMyPalette(colors)
        setCountPlayers(countPlayers);
    }

    /** Update the player data
     * @param {number} pos - The position of the player
     * @param {object} updatedPlayer - The new data of the player */
    const updatePlayer = (pos, updatedPlayer) => {
        setPlayers((prevPlayers) => {
            const prevPlayer = prevPlayers[pos];
            prevPlayers[pos] = { ...prevPlayer, ...updatedPlayer };
            return prevPlayers;
        });
    }

    const onChangeColor = (pos, { color, colors }) => {
        updatePlayer(pos, { color: color });
        setMyPalette(colors);
    }

    const onTeam = () => {
        if (loading) return;

        setLoading(true);
        if (Players[Me.pos].team === null) {
            socket.emit("updateWaitRoom", { type: 0});
        } else {
            socket.emit("updateWaitRoom", { type: 1});
        }
    }

    const createTeam = (pos, { idTeam, teams }) => {
        setTeams(teams);
        updatePlayer(pos, { team: idTeam });
    }

    const leaveTeam = (pos, { teams }) => {
        setTeams(teams);
        updatePlayer(pos, { team: null });
    }

    const joinTeam = (pos, { idTeam, teams }) => {
        setTeams(teams);
        updatePlayer(pos, { team: idTeam });
    }

    const onStartGame = () => {
        setLoading(true);
    }

    const goToGame = (props) => { navigate("/Partida/" + RoomId); }

    const updateWaitRoom = [
        createTeam,
        leaveTeam,
        joinTeam,
        onJoinUser,
        onLeaveUser,
        onChangeColor,
        onStartGame,
        goToGame,
    ]

    const startGame = () => {
        if (loading) return;
        if (!Me.owner) {
            toast.error("No eres el dueño de la sala");
            return;
        }
        if (countPlayers < 2) {
            toast.error("No hay suficientes jugadores");
            return;
        } 

        if (Teams.length !== 0) {
            if ( Teams.some((team) => team?.length === 1 || team?.length === countPlayers) ) {
                toast.error("Revisen los equipos ashhh");
                return;
            }
        }

        socket.emit("updateWaitRoom", { type: 6 });
    }

    /** render a Team */
    const getTeam = (props) => {
        const { Team, index } = props; 
        if (Team == null) return null;
        if (Team.length === 0) return null;
        
        return (<div
            key={"Group" + index}
            onClick={() => {
                socket.emit("updateWaitRoom", { type: 2, moreData: { idTeam: index }})
            }}
            style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(50px, 1fr))",
            justifyItems: "center",
            gap: "25px 10px",
            padding: "10px 10px 20px 10px",
            border: "1px solid white",
            borderRadius: "10px",
        }}>
            {Team.map((indexPlayer) => {
                return GetPlayer({keyName:"Grouped", index:indexPlayer, player: Players[indexPlayer], Me:Me})
            })}
        </div>)
    }

    return (
        <div>

            <img
            className="Loading"
            src={svgLoading} 
            style={{
                display: loading ? "block" : "none",
                bottom: "80px",
                left: "10px",
            }}/>

            <div
            style={{
                display: "grid",
                gridTemplateColumns: "50px 50px auto 50px 50px",
                padding: "0px",
                position: "fixed",
                top: "0px",
                left: "0px",
                width: "100%",
                height: "50px",
                zIndex: "1",
                backgroundColor: "#212121",
                borderBottom: "1px solid #424242",
            }}
            >
                <button className="btnJustIcon" disabled={!Me.owner}> 
                    <img src={svgSettings} width="30" height="30" />
                </button>
                <button className="btnJustIcon">
                    <img src={svgComunity} width="30" height="30" />
                </button>

                <div style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "white",
                    fontSize: "20px",
                }}> BYOND </div>

                <button className="btnJustIcon" onClick={() => {setShowPallet(!showPallet)}}>
                    <img src={svgPaint} alt="Comunity" width="30" height="30" />
                </button>
                <button className="btnJustIcon" onClick={onExit}>
                    <img src={svgExit} alt="Comunity" width="30" height="30" />
                </button>

            </div>

            <br/>
            <br/>
            <br/>

            <h3 style={{ color: "white", marginLeft:"10px" }}>Players: {countPlayers} / 8</h3>
            <h3 style={{ color: "white", marginLeft:"10px" }}>Individuales</h3>
            {/* Este div es el que contiene los jugadores sin equipo */}
            <div
            style={{
                display: "grid",
                gridTemplateColumns: "auto auto auto auto",
                gridTemplateRows: "80px 80px",
                margin: "10px 10px 10px 10px",
                gap: "5px",
                border: "1px solid white",
                justifyItems: "center",
                alignItems: "center",
                borderRadius: "10px",
            }}
            >
                {Players.map((player, index) => {
                    if (player === null) return null;

                    return player?.team != null ?
                    <div key={"Alone" + index} className='OutlinedFari'/>
                    :
                    GetPlayer({keyName:"Alone", index:index, player: player, Me:Me})
                })}
            </div>

            <h3 style={{ color: "white", marginLeft:"10px" }}> Equipos </h3>

            <div
            style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                alignItems: "center",
                margin: "10px 10px 80px 10px",
                gap: "10px",
            }}
            >
                {
                    Teams.map((team, index) => {
                        return getTeam({Team: team, index: index});
                    })
                }
            </div>

            { /** This button contain the logic to create or exit a team 
             * If you are in a team, the button will show the exit team icon and text
             * If you are not in a team, the button will show the create team icon and text */}
            <button
            className="btnIcon"
            onClick={onTeam} 
            style={{
                position: "fixed",
                bottom: "10px",
                left: "10px",
                backgroundColor: "#212121",
                color: "white",
            }}> 

            { Players[Me.pos]?.team !== null ?
            <><img src={svgExitTm} width="30" height="30" /> Salir del Team </>
            :
            <><img src={svgEnterTm} width="30" height="30" /> Crear un Team </>
            }
                
            </button>

            <button
            className="btnIcon"
            onClick={startGame}
            style={{
                position: "fixed",
                bottom: "10px",
                right: "10px",
                backgroundColor: "#212121",
                color: "white",
                opacity: Me.owner ? "1" : "0.5",
                pointerEvents: Me.owner ? "auto" : "none",
            }}>
                <> <img src={svgStart} width="30" height="30" /> Iniciar Partida </>
            </button>

            <Blocker
            deeps={[showPallet]}
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
                    <h2> Paleta de colores </h2>
                    <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "auto auto auto auto",
                        gridTemplateRows: "auto auto auto auto auto",
                        gap: "5px"
                    }}>
                        {MyPalette.map((indexColor, index) => {
                            return <div
                            key={"PCol" + index}
                            onClick={() => {onSelectColor(indexColor)}}
                            style={{
                                backgroundColor: ColorsPallete[indexColor],
                                width: "50px",
                                height: "50px",
                                border: "1px solid white",
                                borderRadius: "10px",
                                cursor: "pointer",
                            }}/>;
                        })}
                    </div>
                    <button
                    className="btnJustIcon"
                    onClick={() => {setShowPallet(!showPallet)}}
                    style={{
                        backgroundColor: "transparent",
                        marginTop: "20px",
                        border: "2px solid white",
                        borderRadius: "10px",
                    }}>
                        <img src={svgExit} width="30" height="30" />
                    </button>
                </div>
            ]}
            />
        </div>
    );
}