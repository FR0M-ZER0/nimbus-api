export const toTimestamp = (date) => {
    return Math.floor(date.getTime() / 1000);
};


export const fromTimestamp = (timestamp) => {
    return new Date(timestamp * 1000);
};


export const formatDataBr = (dateOrTimestamp) => {
    if (!dateOrTimestamp) return '-';
    

    const date = typeof dateOrTimestamp === 'number' 
        ? fromTimestamp(dateOrTimestamp) 
        : dateOrTimestamp;

    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo',
    }).format(date);
};


export const getPeriodoRelatorio = () => {
    const fim = new Date();
    const inicio = new Date();
    

    inicio.setDate(fim.getDate() - 30);
    

    inicio.setHours(0, 0, 0, 0);

    return {
        inicioDate: inicio,
        fimDate: fim,
        inicioTs: toTimestamp(inicio),
        fimTs: toTimestamp(fim),
        textoPeriodo: `${formatDataBr(inicio).split(' ')[0]} a ${formatDataBr(fim).split(' ')[0]}`
    };
};