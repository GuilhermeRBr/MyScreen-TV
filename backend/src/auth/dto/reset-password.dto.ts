import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { AUTH_DTO_MESSAGES } from '../messages/auth.dto.messages';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token recebido por e-mail',
    example: 'a1b2c3d4...',
  })
  @IsNotEmpty({ message: AUTH_DTO_MESSAGES.RESET_TOKEN_REQUIRED })
  @IsString()
  token!: string;

  @ApiProperty({ example: 'NovaSenha123!', minLength: 8, maxLength: 20 })
  @IsNotEmpty({ message: AUTH_DTO_MESSAGES.PASSWORD_REQUIRED })
  @IsString()
  @MinLength(8, { message: AUTH_DTO_MESSAGES.PASSWORD_MIN })
  @MaxLength(20, { message: AUTH_DTO_MESSAGES.PASSWORD_MAX })
  @Matches(/[A-Z]/, { message: AUTH_DTO_MESSAGES.PASSWORD_UPPERCASE })
  @Matches(/[a-z]/, { message: AUTH_DTO_MESSAGES.PASSWORD_LOWERCASE })
  @Matches(/[0-9]/, { message: AUTH_DTO_MESSAGES.PASSWORD_NUMBER })
  @Matches(/[^A-Za-z0-9]/, { message: AUTH_DTO_MESSAGES.PASSWORD_SPECIAL })
  password!: string;
}
