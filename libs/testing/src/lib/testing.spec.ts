import { TESTING_LIB } from './testing';

describe('testing library scaffold', () => {
  it('exposes a stable library identifier and is importable under the configured toolchain', () => {
    expect(TESTING_LIB).toBe('testing');
  });
});
