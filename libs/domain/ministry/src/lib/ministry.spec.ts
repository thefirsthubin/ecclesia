import { MINISTRY_LIB } from './ministry';

describe('ministry library scaffold', () => {
  it('exposes a stable library identifier and is importable under the configured toolchain', () => {
    expect(MINISTRY_LIB).toBe('ministry');
  });
});
