import { Body, Controller, Get, Inject, Post, Req, Res, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/auth.service';
import { DbService } from '../services/db';
import { MailService } from '../services/mail.service';
import { IsString, IsEmail, MaxLength, MinLength, IsBoolean } from 'class-validator';
import * as bcrypt from 'bcrypt';

const getHtmlTemplate = (name: string, link: string) => `
<div role="document">
  <table dir="ltr">
    <tbody>
      <tr>
      <tr>
        <td style="padding:0; font-family:'Segoe UI Light','Segoe UI','Helvetica Neue Medium',Arial,sans-serif; font-size:41px; color:#2672ec">
          Bienvenido a Exampy ${name}
        </td>
      </tr>
      <tr>
        <td id="x_i3" style="padding:0; padding-top:25px; font-family:'Segoe UI',Tahoma,Verdana,Arial,sans-serif; font-size:14px; color:#2a2a2a">
          Usa el siguiente link para verificar tu cuenta
        </td>
      </tr>
      <tr>
        <td id="x_i4" style="padding:0; padding-top:25px; font-family:'Segoe UI',Tahoma,Verdana,Arial,sans-serif; font-size:14px; color:#2a2a2a">
          <a href="${link}" style="color:#2672ec; text-decoration:none">Verificar cuenta</a>
        </td>
      </tr>
    </tbody>
  </table>
</div>
`;

class BodyValidatorSignup {
  @IsEmail()
  email: string;

  @MaxLength(255)
  @MinLength(6)
  @IsString()
  password: string;

  @MaxLength(255)
  @IsString()
  firstName: string;

  @MaxLength(255)
  @IsString()
  lastName: string;
}

class BodyValidatorLogin {
  @MaxLength(255)
  @IsString()
  email: string;

  @MaxLength(255)
  @IsString()
  password: string;

  @IsBoolean()
  keepSesion: boolean;
}

class QueryValidatorValidate {
  @IsString()
  token: string;
}

@Controller('auth')
export class AuthController {
  @Inject(AuthService)
  authService = new AuthService();

  @Inject(DbService)
  dbService = new DbService();

  @Inject(MailService)
  mailService = new MailService();

  readonly tokenName = 'token';

  @Post('sign_up')
  async postSignup(@Body() body: BodyValidatorSignup, @Res() res: FastifyReply) {
    const userExists = (await this.dbService.db.select().from(this.dbService.schema.Users).where(this.dbService.operators.eq(this.dbService.schema.Users.email, body.email)).limit(1)).length > 0;

    if (userExists)
      return res.status(409).send({
        success: false,
        errors: ['emailUsed'],
        data: {}
      });
    const [{ id }] = await this.dbService.db
      .insert(this.dbService.schema.Users)
      .values({
        email: body.email,
        passwordHash: await bcrypt.hash(body.password, await bcrypt.genSalt(10)),
        firstName: body.firstName,
        lastName: body.lastName
      })
      .returning();

    const token = await this.authService.generateToken(id);
    this.mailService.sendMail(body.email, 'Bienvenido a Exampy', '', getHtmlTemplate(`${body.firstName} ${body.lastName}`, `${process.env.BASE_URL}/verify/${token}`));
    return res.status(201).send({
      success: true,
      errors: [],
      data: {}
    });
  }

  @Post('log_in')
  async postLogin(@Body() body: BodyValidatorLogin, @Res() res: FastifyReply) {
    const [userData] = await this.dbService.db.select().from(this.dbService.schema.Users).where(this.dbService.operators.eq(this.dbService.schema.Users.email, body.email)).limit(1);

    const userExists = userData !== undefined;
    if (!userExists)
      return res.status(404).send({
        success: false,
        errors: ['userOrPasswordWrong'],
        data: {}
      });

    const passwordIsCorrect = await bcrypt.compare(body.password, userData.passwordHash);
    if (!passwordIsCorrect)
      return res.status(404).send({
        success: false,
        errors: ['userOrPasswordWrong'],
        data: {}
      });

    if (!userData.verified) {
      const token = await this.authService.generateToken(userData.id);
      this.mailService.sendMail(body.email, 'Bienvenido a Exampy', '', getHtmlTemplate(`${userData.firstName} ${userData.lastName}`, `${process.env.BASE_URL}/verify/${token}`));
      return res.send({
        success: true,
        errors: ['unverified'],
        data: {
          id: userData.id,
          verified: userData.verified
        }
      });
    }

    res
      .setCookie(this.tokenName, await this.authService.generateToken(userData.id), {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: body.keepSesion ? 60 * 60 * 24 : undefined, // 1h
        path: '/'
      })
      .status(200)
      .send({
        success: true,
        errors: [],
        data: {}
      });
  }

  @Get('log_out')
  async getLogout(@Res() res: FastifyReply) {
    res.clearCookie(this.tokenName);
    res.status(200).send({
      success: true,
      errors: [],
      data: {}
    });
  }

  @UsePipes(new ValidationPipe({ transform: true }))
  @Get('user_data')
  async getUserData(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    const token = req.cookies[this.tokenName];
    if (token === undefined)
      return res.status(401).send({
        success: false,
        errors: ['missingToken'],
        data: {}
      });

    const dataToken = this.authService.decodeToken(token);
    if (!dataToken.valid) {
      res.clearCookie(this.tokenName);
      return res.status(404).send({
        success: false,
        errors: ['invalidToken'],
        data: {}
      });
    }

    const userData = await this.dbService.db.query.Users.findFirst({
      columns: {
        passwordHash: false
      },
      where: this.dbService.operators.eq(this.dbService.schema.Users.id, dataToken.id)
    });

    if (userData === undefined)
      return res.status(404).send({
        success: false,
        errors: ['userNotFound'],
        data: {}
      });
    res.send({
      success: false,
      errors: ['missingToken'],
      data: userData
    });
  }

  @Get('verify')
  async getVerify(@Query() query: QueryValidatorValidate, @Res() res: FastifyReply) {
    const dataToken = this.authService.decodeToken(query.token);

    if (!dataToken.valid)
      return res.status(401).send({
        success: false,
        errors: ['invalidToken'],
        data: {}
      });

    await this.dbService.db
      .update(this.dbService.schema.Users)
      .set({ verified: true } as any)
      .where(this.dbService.operators.eq(this.dbService.schema.Users.id, dataToken.id));
    return res.status(201).send({
      success: true,
      errors: [],
      data: {}
    });
  }
}
