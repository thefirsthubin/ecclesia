import { CONTRACTS_LIB } from './contracts';

describe('contracts library scaffold', () => {
  it('exposes a stable library identifier and is importable under the configured toolchain', () => {
    expect(CONTRACTS_LIB).toBe('contracts');
  });
});
