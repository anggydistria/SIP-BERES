import { Global, Module } from '@nestjs/common';

import { StorageService } from './service/storage.service';

@Global()
@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
