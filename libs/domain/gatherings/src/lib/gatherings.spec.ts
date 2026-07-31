import { GATHERINGS_LIB } from './gatherings';

describe('gatherings library scaffold', () => {
  it('exposes a stable library identifier and is importable under the configured toolchain', () => {
    expect(GATHERINGS_LIB).toBe('gatherings');
  });
});
