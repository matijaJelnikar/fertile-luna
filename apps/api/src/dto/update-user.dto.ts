import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

/**
 * Request DTO for `POST /api/auth/user/update`, which completes a profile.
 *
 * `password` is omitted deliberately: this endpoint writes what it is given straight to the
 * column, so accepting a password here would store it unhashed. A credential change needs its
 * own endpoint that hashes.
 */
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const)
) {}
