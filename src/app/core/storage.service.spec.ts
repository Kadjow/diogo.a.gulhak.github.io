import { StorageService } from './storage.service';

describe('StorageService', () => {
  let svc: StorageService;
  beforeEach(() => { localStorage.clear(); sessionStorage.clear(); svc = new StorageService(); });

  it('round-trips local values', () => {
    svc.setLocal('k', 'v');
    expect(svc.getLocal('k')).toBe('v');
  });
  it('returns null for missing local key', () => {
    expect(svc.getLocal('nope')).toBeNull();
  });
  it('round-trips and removes session values', () => {
    svc.setSession('s', 'x');
    expect(svc.getSession('s')).toBe('x');
    svc.removeSession('s');
    expect(svc.getSession('s')).toBeNull();
  });
});
