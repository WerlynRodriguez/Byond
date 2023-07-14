import React, { useEffect, useState } from 'react';
import './FariLogo.css';

const Allanimations = [
    {name:"lLeft", dur: "5s"}, 
    {name:"lRight", dur: "5s"}, 
    {name:"lUp", dur: "5s"}, 
    {name:"lDown", dur: "5s"},
    {name:"blink", dur: "2s"},
    {name:"shake", dur: "3s"},
];

export default function FariLogo(props) {
    const { loading } = props;
    const [animations, setAnimations] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            // Aleaory number between 0 and Allanimations.length
            setAnimations(Math.floor(Math.random() * Allanimations.length));
        }, 5000);
        
        return () => clearInterval(interval);
    }, [animations]);

    return (
        <div 
        className={loading ? "FariLogo wait" : "FariLogo"}
        >
            <div style={{
                animation: loading ? "circle14512 2s linear infinite"
                :
                `${Allanimations[animations].name} ${Allanimations[animations].dur} infinite`
            }}/>
        </div>
    )
}