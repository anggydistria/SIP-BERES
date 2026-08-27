import { Test, TestingModule } from '@nestjs/testing';
import { BrsController } from './brs.controller';

describe('BrsController', () => {
  let controller: BrsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BrsController],
    }).compile();

    controller = module.get<BrsController>(BrsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
