import { RBAC_LIB } from './rbac';

describe('rbac library scaffold', () => {
  it('exposes a stable library identifier and is importable under the configured toolchain', () => {
    expect(RBAC_LIB).toBe('rbac');
  });
});
