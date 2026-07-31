import { PEOPLE_LIB } from './people';

describe('people library scaffold', () => {
  it('exposes a stable library identifier and is importable under the configured toolchain', () => {
    expect(PEOPLE_LIB).toBe('people');
  });
});
