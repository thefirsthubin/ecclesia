import { rm } from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

import { StorageService } from './storage.service';

describe('StorageService', () => {
  function buildService() {
    const dir = path.join(os.tmpdir(), `ecclesia-storage-spec-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const configService = { get: jest.fn().mockReturnValue(dir) };
    const service = new StorageService(configService as never);
    return { service, dir };
  }

  it('save() then read() round-trips the exact bytes and mime type', async () => {
    const { service, dir } = buildService();
    try {
      const original = Buffer.from('a receipt image, pretend bytes');
      const { storageKey, sizeBytes } = await service.save(original, 'image/png');

      expect(storageKey).toMatch(/\.png$/);
      expect(sizeBytes).toBe(original.length);

      const result = await service.read(storageKey);
      expect(result.buffer.equals(original)).toBe(true);
      expect(result.mimeType).toBe('image/png');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('read() throws NotFoundException for an unknown key', async () => {
    const { service, dir } = buildService();
    try {
      await expect(service.read('does-not-exist.pdf')).rejects.toThrow();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('read() rejects a storage key containing a path-traversal sequence', async () => {
    const { service, dir } = buildService();
    try {
      await expect(service.read('../../etc/passwd')).rejects.toThrow();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('remove() deletes a previously saved file, and is a no-op for an unknown key', async () => {
    const { service, dir } = buildService();
    try {
      const { storageKey } = await service.save(Buffer.from('x'), 'application/pdf');
      await service.remove(storageKey);
      await expect(service.read(storageKey)).rejects.toThrow();
      // Removing again (already gone) must not throw.
      await expect(service.remove(storageKey)).resolves.toBeUndefined();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('falls back to an unknown-binary extension/mime for an unrecognized mime type', async () => {
    const { service, dir } = buildService();
    try {
      const { storageKey } = await service.save(Buffer.from('x'), 'application/zip');
      expect(storageKey).toMatch(/\.bin$/);
      const result = await service.read(storageKey);
      expect(result.mimeType).toBe('application/octet-stream');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
