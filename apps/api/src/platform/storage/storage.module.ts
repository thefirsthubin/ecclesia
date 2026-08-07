import { Module } from '@nestjs/common';

import { StorageService } from './storage.service';

/** `[Remaining Engineering Sprint, Milestone 11]` See `StorageService`'s
 * own doc comment. A plain feature module (not global) - imported
 * explicitly by `StewardshipModule`, the same pattern every other
 * cross-cutting-but-not-platform-wide service in this codebase follows
 * (e.g. `EventsModule`), rather than added to `PlatformModule`'s always-on
 * export list for a capability only one module needs today. */
@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
