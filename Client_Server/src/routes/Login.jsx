import React, { useEffect, useState} from "react";
import FariLogo from "../components/FariLogo";
import { useNavigate } from "react-router-dom";
import { useToast } from 'rc-toastr'

import "../components/Components.css";

export default function Login(props){
    const { tryLogin } = props;
    const [name, setName] = useState("");
    const [passWord, setPassWord] = useState("");
    const [loading, setLoading] = useState(true);

    const { toast } = useToast();

    // ====================================== //
    // All Ports IO
    useEffect(() => {
        const name = localStorage.getItem("name");
        if(name)
            setName(name);

    }, []);

    // ======================= //
    // Try to login
    const onClickEntrar = () => {
        if (localStorage.getItem("id")) {
            toast.warning("Ya tienes una sesión iniciada");
            return;
        }
        // El nombre debe tener entre 3 y 9 caracteres sin espacios y solo letras o números
        if (!name.match(/^[a-zA-Z0-9]{3,9}$/)) {
            toast.warning("El nombre debe tener entre 3 y 9 caracteres");
            return;
        }

        // La contraseña debe tener entre 6 y 11 caracteres y al menos un número sin espacios y solo letras y números
        if (!passWord.match(/^[a-zA-Z0-9]{6,11}$/)) {
            toast.warning("La contraseña debe tener entre 6 y 11 caracteres sin espacios y al menos un número");
            return;
        }

        tryLogin(name, null, passWord);
    }

    return (
    <div 
    style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "100px 0px 0px 0px",
    }}>
        <FariLogo/>

        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "50px"
        }}>
            <input
            className="inputWrap"
            type="text"
            placeholder="Nombre de jugador"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={8}
            pattern="[a-zA-Z0-9]{3,9}"
            style={{ marginTop: "20px"}}
            />

            <input
            className="inputWrap"
            type="password"
            placeholder="Contraseña"
            value={passWord}
            onChange={(e) => setPassWord(e.target.value)}
            maxLength={11}
            pattern="[a-zA-Z0-9]{6,11}"
            style={{ marginTop: "20px"}}
            />

            <button
            className="PlayButton"
            style={{ marginTop: "20px"}}
            onClick={onClickEntrar}
            >
                Entrar
            </button>
        </div>
    </div>
    )
}