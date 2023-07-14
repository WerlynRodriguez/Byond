import {  AllUnits } from "../class/units"
import ButtonBuy from "./components/ButtonBuy"
import powerup from "../assets/powerup.svg"

export default function UnitStore(props) {
    const { onBuyUnit, lumty, showMessage, loading } = props;

    const onBuy = (id) => {
        if (loading) return;
        if (lumty < AllUnits[id].price) {
            showMessage("error", "No tienes suficiente lumtys");
            return;
        }
        onBuyUnit(id);
    }

    return (
        <div className="mb-section-list">
            {/* Render all BtnBuy with AllUnits except first position */}
            {AllUnits.slice(1).map((unit, index) => (
                <ButtonBuy
                    key={"BuyUnit" + index + 1}
                    name={unit.name}
                    value={""}
                    img={powerup}
                    simbol={""}
                    prize={unit.price}
                    onBuy={() => onBuy(index + 1)}
                />
            ))}
        </div>
    )
}