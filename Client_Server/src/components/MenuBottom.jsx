import React, { useState, useEffect, forwardRef, useImperativeHandle} from "react";
import UnitMenu from "../menus/UnitMenu";
import UnitStore from "../menus/UnitStore";
import "./MenuBottom.css";

const messageTypes = {
  info: "#84b6f4",
  error: "#ff6961",
  success: "#77dd77",
  warning: "#fdfd96",
}

export const MenuBottom = forwardRef((props, ref) => {
  const { selection, players, me, lumty, onBuyUpgrade, onBuyUnit, loading, death } = props;

  const [info, setInfo] = useState("Buena suerte");
  const [typeInfo, setTypeInfo] = useState("info");
  const [showInfo, setShowInfo] = useState(false);

  const [posTab, setPosTab] = useState(0);

  const [tabs, setTabs] = useState(["Menu"]);

  useImperativeHandle(ref, () => ({
    /** Show a notification message
     * @param {String} type - Type of message
     * @param {String} message - Message to show */
    message(type, message) {
      showMessage(type, message);
    }
  }));

  //=====================================
  // Show a message with a timeout
  const showMessage = (type, message) => {
    if (showInfo) return;

    setInfo(message);
    setTypeInfo(type);
    setShowInfo(true);
    
    setTimeout(() => {
      setShowInfo(false);
    }, 1500);
  }
  //=====================================

  return (
    <div className="menu-bottom">
      <div className="menu-top-lumty">※ {lumty} </div>
      <div className="title-tabs">
        {tabs.map((tab, index) => (
          <div
          key={index}
          className={`title-tab ${posTab === index ? "active" : ""}`}
          onClick={() => posTab !== index ? setPosTab(index) : null}
          >
            {tab}
          </div>
        ))}
      </div>

      <div 
      className={`menu-bottom-info ${showInfo ? "show" : "hide"}`}>
        {info}
        <div style={{
          width:"100%",
          height:"5px",
          margin:"4px 0px",
          borderRadius:"25px",
          backgroundColor: `${messageTypes[typeInfo]}`
        }}></div>
      </div>

      <div className="menu-bottom-content">
        
        {
          death ? "Has muerto" + (players[me].team != null ? " , suerte al resto de tu equipo" : "") 
          :
          !selection ? 
            null 
          :
            selection?.content ?
              selection.info.type == 0 ? //Unit
                <UnitMenu
                loading={loading}
                lumty={lumty}
                selection={selection}
                players={players}
                onBuyUpgrade={onBuyUpgrade}
                showMessage={showMessage}
                />
              :
                null
            :
              selection.type == 2 ?
                <UnitStore
                loading={loading}
                lumty={lumty}
                showMessage={showMessage}
                onBuyUnit={onBuyUnit}
                />
              :
                null
        }

      </div>
    </div>
  );
});