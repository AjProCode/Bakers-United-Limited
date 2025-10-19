
const fractionToDecimal: { [key: string]: number } = {
  '¼': 0.25, '½': 0.5, '¾': 0.75,
  '⅐': 0.142, '⅑': 0.111, '⅒': 0.1,
  '⅓': 0.333, '⅔': 0.666, '⅕': 0.2, '⅖': 0.4, '⅗': 0.6, '⅘': 0.8,
  '⅙': 0.166, '⅚': 0.833, '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
};

function parseFraction(fraction: string): number {
  if (fractionToDecimal[fraction]) {
    return fractionToDecimal[fraction];
  }
  const parts = fraction.split('/');
  if (parts.length === 2) {
    const num = parseInt(parts[0], 10);
    const den = parseInt(parts[1], 10);
    if (!isNaN(num) && !isNaN(den) && den !== 0) {
      return num / den;
    }
  }
  return NaN;
}

export function parseIngredient(ingredient: string): { quantity: number; unitAndName: string } {
    const quantityRegex = /^(\d+\s+)?(\d+\/\d+|\d+.\d+|\d+|[¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])/;
    const match = ingredient.match(quantityRegex);

    if (!match) {
        return { quantity: 1, unitAndName: ingredient };
    }

    let quantity = 0;
    const fullMatch = match[0].trim();
    const parts = fullMatch.split(/\s+/);
    
    parts.forEach(part => {
        if (part.includes('/')) {
            quantity += parseFraction(part);
        } else if (fractionToDecimal[part]) {
            quantity += fractionToDecimal[part];
        } else if (!isNaN(parseFloat(part))) {
            quantity += parseFloat(part);
        }
    });

    const unitAndName = ingredient.substring(match[0].length).trim();
    return { quantity, unitAndName };
}

function decimalToFraction(value: number): string {
    if (value === 0) return '0';
    const tolerance = 1.0E-6;
    let h1 = 1, h2 = 0, k1 = 0, k2 = 1;
    let b = value;
    do {
        let a = Math.floor(b);
        let aux = h1; h1 = a * h1 + h2; h2 = aux;
        aux = k1; k1 = a * k1 + k2; k2 = aux;
        b = 1 / (b - a);
    } while (Math.abs(value - h1 / k1) > value * tolerance);

    if (k1 > 16) { // Limit denominator for readability
        return value.toFixed(2).replace(/\.00$/, '');
    }

    if (h1 % k1 === 0) {
        return `${h1/k1}`;
    }
    
    const whole = Math.floor(h1 / k1);
    const numerator = h1 % k1;

    if (whole === 0) {
      return `${numerator}/${k1}`;
    }
    
    return `${whole} ${numerator}/${k1}`;
}


export function multiplyIngredient(ingredient: string, multiplier: number): string {
  if (multiplier === 1) {
    return ingredient;
  }
  const { quantity, unitAndName } = parseIngredient(ingredient);
  if (quantity === 0) {
    return ingredient; // Likely no quantity found
  }
  const newQuantity = quantity * multiplier;
  
  if (newQuantity === 0) return unitAndName;

  const newQuantityStr = decimalToFraction(newQuantity);

  return `${newQuantityStr} ${unitAndName}`;
}
