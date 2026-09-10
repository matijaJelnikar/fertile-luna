import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * Request DTO for `POST /api/auth/login`.
 *
 * The local Passport strategy reads these fields off the raw body before pipes run, so this
 * contract does not gate authentication; it documents the endpoint and rejects a body carrying
 * anything the contract does not declare.
 */
export class LoginRequestDto {
  @ApiProperty({ example: 'testuser@gmail.com' })
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Testpass123.' })
  @IsNotEmpty()
  @IsString()
  password!: string;
}
