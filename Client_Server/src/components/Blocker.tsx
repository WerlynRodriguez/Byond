import React from "react";

interface BlockerProps {
    /** Array of booleans that indicates if the window should be shown or not */
    deeps: boolean[],
    /** Array of JSX.Element that contains the windows to show */
    windows: JSX.Element[]
}

/** Component that blocks the screen and shows a window
 * The pos of the first true in deeps is the pos of the window to show
 */
function Blocker(props: BlockerProps) {
    const { deeps } = props;
    const pos = deeps.findIndex((deep) => deep);
    if (pos === -1) return null;

    return (
        <div
        style={{
            display: "flex",
            visibility: "visible",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "end",
            paddingBottom: "80px",
            position: "fixed",
            bottom: "0px",
            left: "0px",
            right: "0px",
            top: "0px",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: "50",
        }}>
            {props.windows[pos]} 
        </div>
    )
}

export default Blocker;