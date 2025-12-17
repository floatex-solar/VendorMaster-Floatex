export function getFinancialYear(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return month < 4
    ? `${year - 1}-${String(year).slice(2)}`
    : `${year}-${String(year + 1).slice(2)}`;
}

export function getNextRfqSequence(rows) {
  let max = 0;

  rows.forEach((r) => {
    const rfqNo = r[1]; // Col B
    if (!rfqNo) return;

    const match = rfqNo.match(/\/(\d+)$/);
    if (match) max = Math.max(max, Number(match[1]));
  });

  return max + 1;
}
