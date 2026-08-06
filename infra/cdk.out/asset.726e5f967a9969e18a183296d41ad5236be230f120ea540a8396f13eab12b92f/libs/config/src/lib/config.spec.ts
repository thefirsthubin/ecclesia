import { CONFIG_LIB } from './config';

describe('config library scaffold', () => {
  it('exposes a stable library identifier and is importable under the configured toolchain', () => {
    expect(CONFIG_LIB).toBe('config');
  });
});
