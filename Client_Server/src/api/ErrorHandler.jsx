
export function LoginErrorHandler(errorCode){
    switch(errorCode){
        case 100:
            localStorage.removeItem("id");
            return 'Usuario no encontrado';
        case 101:
            localStorage.removeItem("id");
            return 'Usuario ya conectado';
        case 102:
            return 'Contraseña incorrecta';
        case 103:
            return 'Maximo de usuarios conectados';
        default:
            return 'Error desconocido';
    }
}