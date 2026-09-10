import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

const passwordRegEx =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.-])[A-Za-z\d@$!%*?&.-]{8,20}$/;

export class CreateUserDto {
  @ApiProperty({ example: 'testuser@gmail.com', description: 'User email account' })
  @IsNotEmpty()
  @IsEmail({}, { message: 'Please provide valid Email.' })
  email!: string;

  @ApiProperty({ example: 'Testpass123.', description: "The user's password" })
  @IsNotEmpty()
  @Matches(passwordRegEx, {
    message: `Password must contain Minimum 8 and maximum 20 characters,
    at least one uppercase letter,
    one lowercase letter,
    one number and
    one special character`,
  })
  password!: string;

  @ApiProperty({ required: false, description: 'Set by the server on registration' })
  @IsBoolean()
  @IsOptional()
  profileIncomplete?: boolean;

  @ApiProperty({ required: false, example: 'Ana' })
  @MinLength(2, { message: 'Name must have at least 2 characters.' })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiProperty({ required: false, type: String, format: 'date' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  birthDate?: Date;

  @ApiProperty({ required: false, example: 62 })
  @IsInt()
  @IsOptional()
  weight?: number;
}
