import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { AUTH_DTO_MESSAGES } from '../messages/auth.dto.messages';

export class LoginDto {
  @ApiProperty({ example: 'usuario@email.com' })
  @IsEmail({}, { message: AUTH_DTO_MESSAGES.EMAIL_INVALID })
  email!: string;

  @ApiProperty({ example: 'minhasenha123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: AUTH_DTO_MESSAGES.PASSWORD_MIN })
  password!: string;
}
