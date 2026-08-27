import { Test, TestingModule } from '@nestjs/testing';
import { BrsService } from './brs.service';

describe('BrsService', () => {
  let service: BrsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BrsService],
    }).compile();

    service = module.get<BrsService>(BrsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
