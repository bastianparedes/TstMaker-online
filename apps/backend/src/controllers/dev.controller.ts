import { Controller, Get, Inject } from '@nestjs/common';
import { FileService } from '../services/file.service';

@Controller('dev')
export class HealthController {
  @Inject(FileService)
  fileService = new FileService();

  @Get()
  async getDev() {
    return {
      success: true,
      errors: [],
      data: {}
    };
  }
}
