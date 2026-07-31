import { INSIGHTS_LIB } from './insights';

describe('insights library scaffold', () => {
  it('exposes a stable library identifier and is importable under the configured toolchain', () => {
    expect(INSIGHTS_LIB).toBe('insights');
  });
});
