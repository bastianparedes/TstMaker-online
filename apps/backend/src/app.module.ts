import { Module } from '@nestjs/common';
import { HealthController } from './controllers/dev.controller';
import { AiService } from './services/ai';
import { LatexService } from './services/latex';
import { ExamController } from './controllers/exam.controller';
import { DbService } from './services/db';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { JwtModule } from '@nestjs/jwt';
import { MailService } from './services/mail.service';
import { FileService } from './services/file.service';
import { FileController } from './controllers/file.controller';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET_KEY,
      signOptions: { expiresIn: '1d' }
    })
  ],
  controllers: [HealthController, ExamController, AuthController, FileController],
  providers: [AiService, LatexService, DbService, AuthService, MailService, FileService]
})
export class AppModule {}
