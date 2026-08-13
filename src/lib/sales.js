import { normalizeStage } from "../util/stage";

export function calculateProjectSalesSummary(projects) {
  let actual = 0;
  let expected = 0;

  projects.forEach((project) => {
    const sales = Number(project.computedSales) || 0;
    const stage = normalizeStage(project.stage);

    if (stage === '수주') {
      actual += sales;
    }

    if (stage === '제안 중' || stage === '결과 대기 중') {
      expected += sales;
    }
  });

  return {
    actual,
    expected,
    total: actual + expected,
  };
}

export function calculateRentalSalesSummary(rentals) {
  let actual = 0;
  let expected = 0;

  rentals.forEach((rental) => {
    const sales = Number(rental.sales);

    // 매출이 없는 대관 제외
    if (!Number.isFinite(sales) || sales <= 0) {
      return;
    }

    // 입금 확정 → 발생 매출
    if (rental.paymentConfirmed) {
      actual += sales;
    } else {
      // 입금 미확정 → 예상 매출
      expected += sales;
    }
  });

  return {
    actual,
    expected,
    total: actual + expected,
  };
}

export function calculateKdtSalesSummary(kdtSales, selectedYear) {
  const filteredSales = kdtSales.filter(
    (item) => Number(item.year) === Number(selectedYear),
  );
  
  const actual = kdtSales
    .filter((item) => item.type === '실제')
    .reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0,
    );

  const expectedOperating = kdtSales
    .filter(
      (item) =>
        item.type === '예상' &&
        item.status === '운영 중',
    )
    .reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0,
    );

  const expectedScheduled = kdtSales
    .filter(
      (item) =>
        item.type === '예상' &&
        item.status === '운영 예정',
    )
    .reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0,
    );

  const expected =
    expectedOperating + expectedScheduled;

  return {
    actual,
    expected,
    expectedOperating,
    expectedScheduled,
    total: actual + expected,
  };
}