import { PASTORAL_CARE_LIB } from './pastoral-care';

describe('pastoral-care library scaffold', () => {
  it('exposes a stable library identifier and is importable under the configured toolchain', () => {
    expect(PASTORAL_CARE_LIB).toBe('pastoral-care');
  });
});
