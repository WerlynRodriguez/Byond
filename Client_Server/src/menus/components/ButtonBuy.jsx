export default function ButtonBuy(props) {
    const {name, value, img, prize, simbol, onBuy} = props;
    return (
      <button 
      className="btnMenuBm" 
      onDoubleClick={onBuy}
      prize={"※"+prize}
      >
        <img src={img} alt={name} width={30} height={30} />
        {name} <br/>
        {simbol}{value} <br/>
      </button>
    );
  }