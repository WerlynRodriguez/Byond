import React from "react";
import { Navigate } from "react-router-dom";

type Props = {
    children: JSX.Element;
}

const ProtectedRoute:React.FC<Props> = ({children}) => {
    const lastTokenID = localStorage.getItem("id");

    return lastTokenID ? children : <Navigate to="/" />
}

export default ProtectedRoute;