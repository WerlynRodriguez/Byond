const descriptions = [
    {
        name: 'Fari',
        desc: 
        `Esta unidad fue la primera creada por _____ ___________ ___ _  ____________ 
        __ e_ ________ ____ s___ ____  _. Gracias a eso permite tener su caracteristica 
        principal. Fari no puede atacar`,
        carac: `Iluminación: Ilumina el área alrededor de la unidad. Y solo las unidades
        aleadas pueden ver la iluminación.`,
        super: `Brillo: Se ilumina 20% mas, durante 10s.`,
        easter: `Le da ansiedad la oscuridad.`,
        volt: `Su iluminación aumentará en 20%`
    },
    {
        name: 'Soldi',
        desc:
        `La unidad Soli fue creada con el objetivo de defender a Fari. Su unico propósito
        es defenderlo hasta la muerte. Debido a que solo sirve de carnada, necesita recibir
        la mayor cantidad de daño posible para que Fari pueda escapar.`,
        carac: `Carnada: Soldi tiene 10% de probabilidad de absorber el 50% del daño que recibe.`,
        super: `Insano: Si Fari está al lado (para eso fue creado), Soldi aumentará su daño actual permanentemente en 20%.`,
        easter: `No le gusta las multitudes.`
    },
    {
        name: 'Master',
        desc:
        `Master fue creada para ser la unidad mas tryhard. Su principal caracteristica
        es que puede atacar a cualquier unidad enemiga desde su casa.`,
        carac: `Sniper: Puede atacar a cualquier unidad enemiga a 4 bloques. Tiene un 30%
        de probabilidad de traspasar a la unidad enemiga y dañar a una segunda unidad.`,
        super: `Táctica: Al activarse, Master se invisibiliza durante 14 segundos. Perderá
        el efecto cuando ataque o sea atacado.`,
        easter: `Le gusta el café.`
    },
    {
        name: 'Yasb',
        desc:
        `Yasb fue creada para ser la unidad mas poderosa. Si quisiera podría defender
        a 10 faris él solo. El creador de este juego lo cataloga como "Tanque".`,
        carac: `Tanque: A Yasb no le importa si tiene poca vida o no. Siempre atacará con el 100% de su daño.`,
        super: `Misil: En su próximo ataque, Yasb disparará un misil que dañará a todas las unidades enemigas
        con un radio de 1 bloque.`,
        easter: `Sabe hablar ingles.`
    },
    {
        name: 'Ochi',
        desc:
        `Su creadora quería ser modelo. Pero sus padres la obligaron a estudiar ingeniería eléctrica.
        Es así como Ochi fue creada, esta unidad es capaz de recibir hasta 71 mil voltios. Ochi no puede atacar
        si no está cargada de electricidad. Si Ochi recibe demasiada electricidad, se dañará.`,
        carac: `Voltaje: Si Ochi está cargada puede atacar. Principalmente atacará 3 veces y su daño será
        la carga de electricidad que tenga, dividido entre 3.`,
        super: `Thunder: Ochi activará su pararayos, y tendra el 60% de probabilidad de atraer un rayo. El rayo la
        cargará de electricidad. Ochi canalizará la electricidad y la pasará a las unidades aliadas en un rango de 1.`,
        easter: `Le gusta la moda europea.`
    },
    {
        name: 'Runder',
        desc:
        `Runder fue creado para ser la unidad mas rápida. Capaz de escapar de las situaciones mas peligrosas.
        Su creador fue a la carcel por robarle a un niño de 5 años y no pudo terminar de construirlo. 
        Por eso Runder tiene algunas fallas.`,
        carac: `Nag: Runder es la unica unidad capaz de verse en la oscuridad.`,
        super: `Ladron: Al activarse, en su proximo ataque, Runder tiene el 60% de probabilidad
        de robarle el turno a la unidad enemiga.`,
        easter: `Le gustan los chocoyitos.`
    },
    {
        name: 'Besto',
        desc:
        `Esta unidad es unica en su clase, realiza ataques mediocres, tiene baja vida, pero esconde caracteristicas
        que la hacen muy poderosa. Su creadores querian llamarlo paladin, pero no obtuvieron los derechos de copyright.`,
        carac: `Stunt: Besto paralizará por 2 segundos a la unidad enemiga que ataque.`,
        super: `Paladin: Al activarse, Besto se curará 20% de su vida.`,
        easter: `Le gusta estar oculto bajo una máscara.`,
        volt: `Besto curará el 50% de vida de las unidades aliadas en un rango de 1 bloque.`
    },
    {
        name: 'Krackxel',
        desc:
        `Las tropas enemigas no podian seguirle el paso de contruccion de unidades. Así que ellos crearon a Krackxel.
        Gracias a esta unidad los enemigos podian tener cualquier tropa nuestra. Años depues de guerra, Krackxel decidió
        unirse a nosotros.`,
        carac: `No tiene caracteristicas.`,
        super: `Copy: Al activarse, copiará a cualquier unidad aliada, que esté en un rango de 1 bloque, durante 30s.`,
        easter: `Va al gimnasio, en sus ratos libres.`
    },
]