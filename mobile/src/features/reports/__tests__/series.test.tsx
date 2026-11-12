import { fireEvent, render, screen } from '@testing-library/react-native';

import type { IsoDate } from '@/domain/date';
import { makeTransaction } from '@/test-utils/transactions';

import { LineTrendChart } from '../components/LineTrendChart';
import { buildTrendSeries } from '../series';

const today = '2026-11-12' as IsoDate; // a Thursday
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const transactions = [
  makeTransaction({ amount: 10000, occurredOn: '2026-11-12' }),
  makeTransaction({ amount: 20000, occurredOn: '2026-11-07' }), // Saturday
  makeTransaction({ amount: 30000, occurredOn: '2026-11-06' }), // Friday
  makeTransaction({
    type: 'income',
    categoryId: 'salary',
    amount: 500000,
    occurredOn: '2026-10-01',
  }),
  makeTransaction({ amount: 40000, occurredOn: '2026-05-20' }), // previous 6-month window
];

describe('buildTrendSeries', () => {
  it('1M: 30 daily points ending today', () => {
    const series = buildTrendSeries(transactions, '1M', today, 6);
    expect(series.granularity).toBe('day');
    expect(series.points).toHaveLength(30);
    expect(series.points.at(-1)).toMatchObject({ start: today, end: today, expense: 10000 });
    expect(series.points[0].start).toBe('2026-10-14');
  });

  it('3M: 13 weeks starting on the chosen weekday', () => {
    const saturday = buildTrendSeries(transactions, '3M', today, 6);
    expect(saturday.points).toHaveLength(13);
    // Week containing Thu 12 Nov starts Sat 7 Nov: includes 7 and 12, not Fri 6.
    expect(saturday.points.at(-1)).toMatchObject({
      start: '2026-11-07',
      end: '2026-11-13',
      expense: 30000,
    });

    const monday = buildTrendSeries(transactions, '3M', today, 1);
    expect(monday.points.at(-1)).toMatchObject({ start: '2026-11-09', expense: 10000 });
  });

  it('6M and 1Y: calendar months', () => {
    const six = buildTrendSeries(transactions, '6M', today, 6);
    expect(six.points.map((p) => p.start)).toEqual([
      '2026-06-01',
      '2026-07-01',
      '2026-08-01',
      '2026-09-01',
      '2026-10-01',
      '2026-11-01',
    ]);
    expect(six.points[4]).toMatchObject({ end: '2026-10-31', income: 500000 });
    expect(buildTrendSeries(transactions, '1Y', today, 6).points).toHaveLength(12);
  });

  it('averages expense per point and compares with the previous period', () => {
    const six = buildTrendSeries(transactions, '6M', today, 6);
    // Nov: 60,000 over 6 months = 10,000; previous 6 months (Dec–May): 40,000 / 6 ≈ 6,667
    expect(six.averageExpense).toBe(10000);
    expect(six.previousAverageExpense).toBe(6667);
    expect(buildTrendSeries([], '6M', today, 6).previousAverageExpense).toBeNull();
  });
});

describe('LineTrendChart', () => {
  const series = buildTrendSeries(transactions, '6M', today, 6);

  async function renderChart() {
    const onChangeRange = jest.fn();
    await render(
      <LineTrendChart series={series} onChangeRange={onChangeRange} monthNames={MONTHS} />,
    );
    // Give the chart a width (normally measured on screen).
    await fireEvent(screen.getByTestId('line-chart'), 'layout', {
      nativeEvent: { layout: { width: 352, height: 180, x: 0, y: 0 } },
    });
    return onChangeRange;
  }

  it('shows the headline average and its change in words, not colour alone', async () => {
    await renderChart();
    expect(screen.getByText('Avg. monthly expense')).toBeOnTheScreen();
    expect(screen.getByTestId('trend-average')).toHaveTextContent('৳100.00');
    expect(screen.getByTestId('trend-change')).toHaveTextContent(
      '৳33.33 more than the previous 6 months',
    );
  });

  it('shows a tooltip for the touched point', async () => {
    await renderChart();
    expect(screen.queryByTestId('trend-tooltip')).toBeNull();

    // Plot spans x = 52…352 for 6 points (step 60): x = 292 is the 5th point (Oct).
    await fireEvent(screen.getByTestId('line-chart'), 'responderGrant', {
      nativeEvent: { locationX: 292, locationY: 50 },
    });

    expect(screen.getByTestId('trend-tooltip')).toHaveTextContent(
      /Oct.*Income: ৳5,000.00.*Expense: ৳0.00/,
    );
  });

  it('switches range', async () => {
    const onChangeRange = await renderChart();
    await fireEvent.press(screen.getByTestId('range-3M'));
    expect(onChangeRange).toHaveBeenCalledWith('3M');
  });
});
