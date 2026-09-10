import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';

import { AuthGuard } from '@nestjs/passport';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../decorators/public.decorator';
import { CreateUserDto } from '../../dto/create-user.dto';
import { UpdateUserDto } from '../../dto/update-user.dto';
import { LoginRequestDto } from './dto/login.dto';
import { LoginResponseDTO } from './dto/login-response.dto';
import { RegisterResponseDTO } from './dto/register-response.dto';
import { AuthenticatedRequest } from './types/AuthenticatedRequest';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Unauthenticated and the one endpoint that reveals whether an account exists.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Public()
  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(
    @Body() _credentials: LoginRequestDto,
    @Request() req: AuthenticatedRequest
  ): Promise<LoginResponseDTO | BadRequestException> {
    return this.authService.login(req.user);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Public()
  @Post('register')
  async register(
    @Body() registerBody: CreateUserDto
  ): Promise<RegisterResponseDTO | BadRequestException> {
    registerBody.profileIncomplete = true;
    return await this.authService.register(registerBody);
  }

  @ApiBearerAuth()
  @Post('user/update')
  async update(
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.authService.update(req.user.uuid, updateUserDto);
  }

  @ApiBearerAuth()
  @Get('user/me')
  async getMe(@Req() req: AuthenticatedRequest) {
    return this.authService.getMe(req.user['uuid']);
  }
}
