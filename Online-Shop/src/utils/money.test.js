import { it, expect } from 'vitest'
import { formatMoney } from './money'
//Expect let us check if the result is correct

it('formats 1999 cents as $19.99', () => {
    expect(formatMoney(1999)).toBe('$19.99');
});

//This test if the first value is equal to the second value

it('displays 2 decimals', () =>{
    expect(formatMoney(1090)).toBe('$10.90');
    expect(formatMoney(100)).toBe('$1.00');
})