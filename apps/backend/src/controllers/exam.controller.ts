import { Controller, Inject, Post, Body, Req, Res, UseGuards } from '@nestjs/common';
import { AiService } from '../services/ai';
import { DbService } from '../services/db';
import { LatexService } from '../services/latex';
import { AuthService } from '../services/auth.service';
import { FileService } from '../services/file.service';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { IsInt, Max, Min, IsString, MaxLength, IsArray, ValidateNested, IsOptional, IsObject, IsNotEmptyObject, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { getShuffledArray } from '../utils/array';
import { writeFileSync } from 'fs';
import { Subject } from '../types/exercise';
import { AuthGuard } from '../guards/auth.guard';
import fetch from 'node-fetch';

class ExerciseDescriptionValidator {
  @IsString()
  @MaxLength(200)
  description: string;

  @IsInt()
  @Min(1)
  @Max(10)
  quantity: number;
}

class ExercisesValidator {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseDescriptionValidator)
  uniqueSelection?: ExerciseDescriptionValidator[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseDescriptionValidator)
  development?: ExerciseDescriptionValidator[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseDescriptionValidator)
  trueOrFalse?: ExerciseDescriptionValidator[];
}

class BodyValidator {
  @IsObject()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => ExercisesValidator)
  exercises: ExercisesValidator;

  @IsBoolean()
  includeAnswers: boolean;

  @IsString()
  subject: Subject;

  @IsString()
  @MaxLength(200)
  contextSchool: string;

  @IsString()
  @MaxLength(200)
  contextEstudent: string;
}

@Controller('exam')
@UseGuards(AuthGuard)
export class ExamController {
  @Inject(DbService)
  dbService = new DbService();

  @Inject(AiService)
  aiService = new AiService();

  @Inject(LatexService)
  latexService = new LatexService();

  @Inject(FileService)
  fileService = new FileService();

  @Inject(AuthService)
  authService = new AuthService();

  @Post()
  async PostCreateExam(@Body() body: BodyValidator, @Req() req: FastifyRequest, @Res() res: FastifyReply) {
    const { id: userId } = this.authService.decodeToken(req.cookies[this.authService.tokenName]);

    const exercisesLatexCodes = await this.aiService.getExercisesLatexCodes(body.exercises, body.subject, body.contextSchool, body.contextEstudent);

    const latexLinesQuestions: string[] = [];
    const latexLinesAnswers: string[] = ['\\newpage\\begin{center}\\LARGE Respuestas\\end{center}'];

    if (exercisesLatexCodes.uniqueSelection !== undefined) {
      const result = this.latexService.getLatexSectionUniqueSelection(getShuffledArray(exercisesLatexCodes.uniqueSelection));
      latexLinesQuestions.push(result.questions);
      latexLinesAnswers.push(result.answers);
    }

    if (exercisesLatexCodes.development !== undefined) {
      const result = this.latexService.getLatexSectionDevelopment(getShuffledArray(exercisesLatexCodes.development));
      latexLinesQuestions.push(result.questions);
      latexLinesAnswers.push(result.answers);
    }

    if (exercisesLatexCodes.trueOrFalse !== undefined) {
      const result = this.latexService.getLatexSectionTrueOrFalse(getShuffledArray(exercisesLatexCodes.trueOrFalse));
      latexLinesQuestions.push(result.questions);
      latexLinesAnswers.push(result.answers);
    }

    let completeLatexCodeLines = [...latexLinesQuestions];

    if (body.includeAnswers) completeLatexCodeLines = completeLatexCodeLines.concat(latexLinesAnswers);
    const completeLatexCode = this.latexService.getCompleteLatexCode(completeLatexCodeLines.join('\n'));

    if (process.env.NODE_ENV === 'development') writeFileSync('latex.tex', completeLatexCode, 'utf-8');

    const fileUrl = new URL(await this.latexService.getFileUrl(completeLatexCode));
    if (!fileUrl.href.endsWith('.pdf'))
      return res.status(500).send({
        success: false,
        errors: ['badLatex'],
        data: {
          fileName: fileUrl.href
        }
      });

    const pathSections = fileUrl.pathname.split('/');
    const lastPathSection = pathSections[pathSections.length - 1];

    res.send({
      success: true,
      errors: [],
      data: {
        fileName: lastPathSection
      }
    });

    await this.dbService.db.transaction(async (tx) => {
      const buffer = await fetch(fileUrl).then((response) => response.buffer());
      const fileId = await this.fileService.upload(userId, buffer, 'raw');

      await tx.insert(this.dbService.schema.Exams).values({
        id: fileId,
        userId: userId
      });
    });
  }
}
