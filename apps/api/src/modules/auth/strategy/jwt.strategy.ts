import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AccessTokenPayload } from '../types/AccessTokenPayload';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  // Defence in depth: TypeORM drops an `undefined` value from a `where`, so a payload without a
  // uuid would turn every ownership clause into no clause at all.
  async validate(payload: AccessTokenPayload) {
    if (!payload?.uuid) {
      throw new UnauthorizedException();
    }

    return payload;
  }
}
