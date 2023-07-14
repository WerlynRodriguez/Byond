export default function StatInfo(props) {
    const {min, max, img} = props;
    return ( <>
    <img className="stat-info" src={img} width={20} height={20}/> : {min} / {max}
    </>)
}