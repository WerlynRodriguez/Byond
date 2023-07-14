import React, { useEffect, useState, useContext} from "react";
import FariLogo from "../components/FariLogo";
import { useNavigate } from "react-router-dom";
import { useToast } from 'rc-toastr'
import { SocketContext } from '../api/SocketProvider'

import "../components/Components.css";
import Blocker from "../components/Blocker";

const validationPath = (path) => path.length >= 6 && path.length <= 12;

export default function Lobby(props){
    //const [loading, setLoading] = useState(true);
    const [codes, setCodes] = useState({owner:"", code:""});

    const [ viewUnirse, setViewUnirse ] = useState(false);

    const navigate = useNavigate();
    const { toast } = useToast();
    const { socket } = useContext(SocketContext);

    // ====================================== //
    // All Ports IO
    useEffect(() => {

        socket.on("createGame", (data) => {
            if (data.id)
                navigate("/WaitR/" + data.id);
            else 
                toast.error(data.error);
        });


        return () => {
            socket.off("createGame");
        }
    }, []);

    const onClickSalir = () => {
        const id = localStorage.getItem("id");
        socket.emit("Logout", {PlayerID : id});
    }

    // Try to Create a Room
    const onClickCreateRoom = () => {
        socket.emit("createGame")
    }
    // Try to Join a Room
    const onClickJoinRoom = (e) => {
        e.preventDefault();

        let stringPath = codes.owner+codes.code;
        const path = validationPath(stringPath);
        if (!path){
            toast.error("El código de la sala no es válido");
            return;
        }

        navigate("/WaitR/" + stringPath);
    }

    const handleInput = (e) => {
        setCodes({
            ...codes,
            [e.target.name] : e.target.value
        })
    }

    return (
    <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "100px 0px 0px 0px",
    }}> 
        <button className="btnIcon"
        style={{
            backgroundColor: "#e74c3c",
            position: "fixed",
            top: "0px",
            right: "0px",
            margin: "10px",
        }} 
        onClick={onClickSalir}>
            <span className="icon">
                <svg viewBox="0 0 175 80" width="40" height="40">
                    <rect width="80" height="15" fill="#f0f0f0" rx="10"></rect>
                    <rect y="30" width="80" height="15" fill="#f0f0f0" rx="10"></rect>
                    <rect y="60" width="80" height="15" fill="#f0f0f0" rx="10"></rect>
                </svg>
            </span>
            <span className="text">Salir</span>
        </button>

        <FariLogo />

        <div style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "end",
            position: "fixed",
            bottom: "0px",
            right: "0px",
            width: "100%",
            maxWidth: "250px",
            padding: "10px",
            justifyContent: "space-between",
        }}>
            <button 
            className="PlayButton"
            onClick={() => setViewUnirse(!viewUnirse)}
            > Unirse </button>

            <button 
            className="PlayButton"
            onClick={onClickCreateRoom}
            > Crear </button>
        </div>

        <Blocker
        deeps={[viewUnirse]}
        windows={[
            <form
            onSubmit={onClickJoinRoom}
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
                <h2> Unirse a una Sala </h2>
                <input
                className="inputWrap"
                style={{ marginTop: "10px" }}
                type="text"
                required
                pattern="[a-zA-Z0-9]{3,9}"
                title="El código de la sala debe tener entre 3 y 9 caracteres alfanuméricos"
                maxLength={8}
                placeholder="Protagonista"
                name="owner"
                value={codes.owner}
                onChange={handleInput}
                />

                <input
                className="inputWrap"
                style={{ marginTop: "10px" }}
                type="text"
                required
                pattern="[a-zA-Z0-9]{3}"
                title="El código de la sala debe tener 3 caracteres alfanuméricos"
                maxLength={3}
                placeholder="Sector"
                name="code"
                value={codes.code}
                onChange={handleInput}
                />

                <input
                className="PlayButton"
                type="submit"
                style={{ marginTop: "20px" }}
                />

                <button
                className="PlayButton"
                style={{ marginTop: "10px", backgroundColor: "#e74c3c" }}
                onClick={() => setViewUnirse(!viewUnirse)}
                > Cancelar </button>

            </form>
        ]} />

    </div>
    );
}