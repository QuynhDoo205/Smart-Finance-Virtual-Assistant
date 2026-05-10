export function numberToVietnameseWords(number: number): string {
  if (number === 0) return 'Không đồng';
  
  const units = ['', ' nghìn', ' triệu', ' tỷ', ' nghìn tỷ', ' triệu tỷ'];
  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

  function readThreeDigits(n: number, showZeroHundred: boolean): string {
    const hundred = Math.floor(n / 100);
    const ten = Math.floor((n % 100) / 10);
    const unit = n % 10;
    let res = '';

    if (hundred > 0 || showZeroHundred) {
      res += digits[hundred] + ' trăm ';
    }

    if (ten > 1) {
      res += digits[ten] + ' mươi ';
      if (unit === 1) res += 'mốt';
      else if (unit === 5) res += 'lăm';
      else if (unit > 0) res += digits[unit];
    } else if (ten === 1) {
      res += 'mười ';
      if (unit === 5) res += 'lăm';
      else if (unit > 0) res += digits[unit];
    } else if (ten === 0 && unit > 0) {
      if (hundred > 0 || showZeroHundred) res += 'lẻ ';
      res += digits[unit];
    }

    return res.trim();
  }

  let res = '';
  let unitIdx = 0;
  let tempNum = Math.abs(number);

  while (tempNum > 0) {
    const threeDigits = tempNum % 1000;
    if (threeDigits > 0) {
      const part = readThreeDigits(threeDigits, tempNum >= 1000);
      res = part + units[unitIdx] + (res ? ' ' + res : '');
    }
    tempNum = Math.floor(tempNum / 1000);
    unitIdx++;
  }

  res = res.trim();
  if (res.endsWith(' nghìn')) res += ' đồng';
  else if (!res.endsWith('đồng')) res += ' đồng';

  return res.charAt(0).toUpperCase() + res.slice(1);
}
