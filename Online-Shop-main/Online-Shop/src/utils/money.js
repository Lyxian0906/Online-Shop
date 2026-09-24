export function formatMoney(amountCents) {
    return `$${(amountCents / 100).toFixed(2)}`;
}

/*This function let us convert any amount cents into any format*/