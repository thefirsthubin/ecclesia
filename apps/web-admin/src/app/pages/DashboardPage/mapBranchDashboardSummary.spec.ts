import type { BranchDashboardSummaryResponseDto } from '@ecclesia/contracts';

import {
  attendanceKpiFromSummary,
  bacentaLeaderboardFromSummary,
  buildResidentPastorKpis,
  givingKpiFromSummary,
  growthSeriesFromSummary,
  membersKpiFromSummary,
  volunteersKpiFromSummary,
} from './mapBranchDashboardSummary';

function buildSummary(overrides: Partial<BranchDashboardSummaryResponseDto> = {}): BranchDashboardSummaryResponseDto {
  return {
    branchId: 'branch-1',
    membersCount: 482,
    membersTrend: 12,
    attendanceTotal: 356,
    attendanceTrend: -8,
    givingTotalMinor: '2450000',
    givingTrend: 8,
    growthSeries: {
      attendance: [{ label: 'Mar', value: 398 }, { label: 'Aug', value: 356 }],
      membership: [{ label: 'Mar', value: 451 }, { label: 'Aug', value: 482 }],
      giving: [{ label: 'Mar', value: 1980000 }, { label: 'Aug', value: 2450000 }],
    },
    volunteersCount: 67,
    volunteersTrend: -2,
    bacentaLeaderboard: [
      { groupId: 'bacenta-4', name: 'Bacenta 4', leaderName: 'Grace Owusu', score: 91 },
      { groupId: 'bacenta-9', name: 'Bacenta 9', leaderName: null, score: 78 },
    ],
    engagementTrend: { direction: 'up', deltaPoints: 6, windowDays: 21 },
    ...overrides,
  };
}

describe('membersKpiFromSummary', () => {
  it('formats membersCount and a signed absolute-count trend (not a percentage)', () => {
    const kpi = membersKpiFromSummary(buildSummary());

    expect(kpi.formattedValue).toBe('482');
    expect(kpi.trendLabel).toBe('+12 this month');
    expect(kpi.trendDirection).toBe('up');
    expect(kpi.actionHref).toBe('/people');
  });

  it('signs a negative membersTrend correctly and reports a down trend', () => {
    const kpi = membersKpiFromSummary(buildSummary({ membersTrend: -3 }));

    expect(kpi.trendLabel).toBe('-3 this month');
    expect(kpi.trendDirection).toBe('down');
  });

  it('reports a flat trend for zero net change', () => {
    const kpi = membersKpiFromSummary(buildSummary({ membersTrend: 0 }));

    expect(kpi.trendDirection).toBe('flat');
    expect(kpi.trendLabel).toBe('+0 this month');
  });
});

describe('attendanceKpiFromSummary', () => {
  it('formats attendanceTotal and a signed percentage trend', () => {
    const kpi = attendanceKpiFromSummary(buildSummary());

    expect(kpi.formattedValue).toBe('356');
    expect(kpi.trendLabel).toBe('-8% vs. last month');
    expect(kpi.trendDirection).toBe('down');
    expect(kpi.actionHref).toBe('/insights');
  });
});

describe('givingKpiFromSummary', () => {
  it('formats givingTotalMinor via the shared Stewardship amountMinor formatter', () => {
    const kpi = givingKpiFromSummary(buildSummary());

    expect(kpi.formattedValue).toBe('GHS 24,500.00');
    expect(kpi.trendLabel).toBe('+8% this month');
    expect(kpi.trendDirection).toBe('up');
    expect(kpi.actionHref).toBe('/stewardship');
  });
});

describe('volunteersKpiFromSummary', () => {
  it('formats volunteersCount and a signed absolute-count trend (not a percentage)', () => {
    const kpi = volunteersKpiFromSummary(buildSummary());

    expect(kpi.formattedValue).toBe('67');
    expect(kpi.trendLabel).toBe('-2 vs. last month');
    expect(kpi.trendDirection).toBe('down');
    expect(kpi.actionHref).toBe('/ministry');
  });

  it('reports an up trend for positive volunteersTrend', () => {
    const kpi = volunteersKpiFromSummary(buildSummary({ volunteersTrend: 5 }));

    expect(kpi.trendLabel).toBe('+5 vs. last month');
    expect(kpi.trendDirection).toBe('up');
  });
});

describe('buildResidentPastorKpis', () => {
  it('orders Members, Attendance, Giving, Volunteers - all four real', () => {
    const kpis = buildResidentPastorKpis(buildSummary());

    expect(kpis.map((kpi) => kpi.id)).toEqual(['members', 'attendance', 'giving', 'volunteers']);
    expect(kpis[3].formattedValue).toBe('67');
  });
});

describe('bacentaLeaderboardFromSummary', () => {
  it('renames fields to BacentaLeaderboardCard\'s expected shape, preserving backend ordering', () => {
    const result = bacentaLeaderboardFromSummary(buildSummary().bacentaLeaderboard);

    expect(result).toEqual([
      { id: 'bacenta-4', bacentaName: 'Bacenta 4', leaderName: 'Grace Owusu', engagementPercent: 91 },
      { id: 'bacenta-9', bacentaName: 'Bacenta 9', leaderName: 'No leader assigned', engagementPercent: 78 },
    ]);
  });

  it('returns an empty array, not an error, when the backend sends no entries', () => {
    expect(bacentaLeaderboardFromSummary([])).toEqual([]);
  });

  it('rounds a non-integer score for display', () => {
    const result = bacentaLeaderboardFromSummary([{ groupId: 'bacenta-1', name: 'Bacenta 1', leaderName: null, score: 78.6 }]);

    expect(result[0].engagementPercent).toBe(79);
  });
});

describe('growthSeriesFromSummary', () => {
  it('passes attendance/membership through unchanged (already the right unit)', () => {
    const result = growthSeriesFromSummary(buildSummary());

    expect(result.attendance).toEqual([{ label: 'Mar', value: 398 }, { label: 'Aug', value: 356 }]);
    expect(result.membership).toEqual([{ label: 'Mar', value: 451 }, { label: 'Aug', value: 482 }]);
  });

  it('converts giving from minor to major currency units for the chart', () => {
    const result = growthSeriesFromSummary(buildSummary());

    expect(result.giving).toEqual([{ label: 'Mar', value: 19800 }, { label: 'Aug', value: 24500 }]);
  });
});
