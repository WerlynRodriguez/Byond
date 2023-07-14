import StatInfo from "./components/StatInfo";
import ButtonBuy from "./components/ButtonBuy";

import vida from "../assets/health.svg";
import daño from "../assets/damage.svg";
import pasos from "../assets/step.svg";
import velocidad from "../assets/stepTime.svg";
import ilum from "../assets/ilumination.svg";
import atkRange from "../assets/range.svg";

import { useEffect, useMemo, useState } from "react";

const statsToBuy = {
    Hp: {
        value: 2,
        img: vida,
        max: 50,
        type: "asc",
    },
    Atk: {
        value: 1,
        img: daño,
        max: 20,
        type: "asc",
    },
    Stp: {
        value: 1,
        img: pasos,
        max: 8,
        type: "asc",
    },
    StpTm: {
        value: 0.5,
        img: velocidad,
        max: 3,
        type: "dsc",
    },
    Lum: {
        value: 20,
        img: ilum,
        max: 400,
        type: "asc",
    },
    AtkRng: {
        value: 0,
        img: atkRange,
        max: 10,
        type: "asc",
    },
}

export default function UnitMenu(props){
  const { selection, players, onBuyUpgrade, showMessage, lumty, loading } = props;
  const [statsUnit, setStatsUnit] = useState([]);


  useEffect(() => {
    setStatsUnit(Object.keys(selection.content.stats))
  }, [selection.info.pos])

  const onBuyStat = (stat) => {
    if (loading) return;
    if (selection.content.stats[stat].s > lumty) {
      showMessage("error", "No tienes suficiente lumty");
      return;
    }

    if (statsToBuy[stat].type === "asc"){
      if (selection.content.stats[stat].m >= statsToBuy[stat].max) {
        showMessage("error", "No puedes mejorar mas esta estadistica");
        return;
      }}
    else
      if (selection.content.stats[stat].m <= statsToBuy[stat].max) {
        showMessage("error", "No puedes mejorar mas esta estadistica");
        return;
      }
      
    if (selection.content.stats[stat]?.m <= 0) {
      showMessage("error", "No puedes mejorar esta estadistica");
      return;
    }

    onBuyUpgrade(selection.info.pos, stat);  
  }

  return (
      <>
      <div className="menu-top-info">
        {statsUnit.map((stat, index) => ( 
          <StatInfo
          key={"StatInfo" + index}
          min={selection.content.stats[stat]?.c}
          max={selection.content.stats[stat]?.m}
          img={statsToBuy[stat].img}
          />
        ))}
      </div>

      <div className="mb-section-list">
        {statsUnit
        .filter(stat => (selection.content.stats[stat]?.s))
        .map((stat, index) => (
          <ButtonBuy
          key={"BuyStat" + index}
          name={stat}
          value={statsToBuy[stat].value}
          img={statsToBuy[stat].img}
          simbol={statsToBuy[stat].type === "asc" ? "+" : "-"}
          prize={selection.content.stats[stat].s}
          onBuy={() => onBuyStat(stat)}
          />
        ))}
      </div>
    </>
  )
}