import { Controller, Get, Param, Inject, Res, UseGuards, Req } from '@nestjs/common';
import { FileService } from '../services/file.service';
import { AuthService } from '../services/auth.service';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AuthGuard } from '../guards/auth.guard';

@Controller('file')
@UseGuards(AuthGuard)
export class FileController {
  @Inject(FileService)
  fileService = new FileService();

  @Inject(AuthService)
  authService = new AuthService();

  @Get('pdf/:fileId')
  async getPdfFile(@Param('fileId') fileId: string, @Req() req: FastifyRequest, @Res() res: FastifyReply) {
    res.header('Content-Type', 'application/pdf');

    const { id: userId } = this.authService.decodeToken(req.cookies[this.authService.tokenName]);

    const pdfBuffer = await this.fileService.get(userId, fileId, 'raw');
    res.send(pdfBuffer);
  }

  @Get('image/:fileId')
  async getFile(@Param('fileId') fileId: string, @Req() req: FastifyRequest, @Res() res: FastifyReply) {
    // res.header('Content-Type', 'image/png');

    const { id: userId } = this.authService.decodeToken(req.cookies[this.authService.tokenName]);
    const pdfBuffer = await this.fileService.get(userId, fileId, 'image');
    res.send(pdfBuffer);
  }
}
