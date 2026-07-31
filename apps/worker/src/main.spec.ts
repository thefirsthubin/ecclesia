import { bootstrap } from './main';

describe('worker bootstrap', () => {
  it('starts without throwing', () => {
    expect(() => bootstrap()).not.toThrow();
  });
});
