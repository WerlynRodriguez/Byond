import React, { useEffect, createContext, useState } from 'react'
import io from "socket.io-client"
import { useToast } from 'rc-toastr'
import FariLogo from '../components/FariLogo'
import Login from '../routes/Login'
import { LoginErrorHandler } from './ErrorHandler'
import { Outlet, useLocation } from 'react-router-dom'

export const SocketContext = createContext(null)

const socket = io('192.168.1.14:5000')
//const socket = io('172.23.82.105:5000')

const devmode = false;

/** Socket Provider
* This provider is used to share the socket connection
* with all the components of the application*/

export function SocketProvider(props) {
    const [Connected, setConnected] = useState(false) // Socket connection state
    const [Logged, setLogged] = useState(false) // Login state
    const [Loading, setLoading] = useState(true) // Is fetching data ?

    //get my actual path
    const location = useLocation();

    const { toast } = useToast()

    useEffect(() => {
        socket.on("connect", onConnect)
        socket.on("disconnect", onDisconnect)
        socket.on("Login", onLogin)
        socket.on("Logout", onLogout)

        return () => {
            socket.off("connect", onConnect)
            socket.off("disconnect", onDisconnect)
            socket.off("Login", onLogin)
            socket.off("Logout", onLogout)
        }
    }, [])

    const onConnect = () => {
        setConnected(true)
        const lastID = localStorage.getItem("id");

        if(lastID)
            tryLogin(localStorage.getItem("name"), lastID, null);
        else
            setLoading(false)
    }

    const onLogin = (data) => {
        setLoading(false)
        const { id, name } = data;

        if(id){
            localStorage.setItem("name", name);
            localStorage.setItem("id", id);
            setLogged(true)
            return;
        }

        toast(LoginErrorHandler(data.error));
    }

    const onLogout = () => {
        localStorage.removeItem("id");
        setLogged(false)
    }

    const onDisconnect = () => {
        setConnected(false)
        setLogged(false)
    }

    const tryLogin = (name, id, pass) => {
        setLoading(true)
        socket.emit("Login", {
            PlayerName : name, 
            PlayerID : id, 
            PlayerPass : pass, 
            PlayerPath : location.pathname
        })
    }

    return (
        <SocketContext.Provider value={{ socket }}>
            { devmode ? <Outlet/> : Connected && !Loading ?
                Logged ?
                    <Outlet />
                    :
                    <Login tryLogin={tryLogin} />
                :
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "100px 0px 0px 0px",
                    width: "100%",
                }}> 
                    <FariLogo loading={true} />

                    <h3 style={{color:"azure"}}>
                        Conectando con el servidor...
                    </h3>
                </div>
            }
            
        </SocketContext.Provider>
    );
}