import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Put,
  Req,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';

import { AuthGuard } from '@nestjs/passport';

import { Public } from '../../decorators/public.decorator';
import { CreateUserDto } from '../../dto/create-user.dto';
import { UpdateUserDto } from '../../dto/update-user.dto';
import { LoginResponseDTO } from './dto/login-response.dto';
import { RegisterResponseDTO } from './dto/register-response.dto';
import { JwtGuard } from './guards/jwt.guard';
import { AuthenticatedRequest } from './types/AuthenticatedRequest';

@Public()
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(
    @Request() req: AuthenticatedRequest
  ): Promise<LoginResponseDTO | BadRequestException> {
    return this.authService.login(req.user);
  }

  @Post('register')
  async register(
    @Body() registerBody: CreateUserDto
  ): Promise<RegisterResponseDTO | BadRequestException> {
    registerBody.profileIncomplete = true;
    return await this.authService.register(registerBody);
  }

  @UseGuards(JwtGuard)
  @Put('user/update')
  async update(
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.authService.update(req.user.uuid, updateUserDto);
  }
}
