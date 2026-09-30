import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsNotEmpty,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Match } from '../decorators/match.decorator';
import { AUTH_DTO_MESSAGES } from '../messages/auth.dto.messages';

export class RegisterDto {
  @ApiProperty({ example: 'usuario@email.com' })
  @IsNotEmpty({ message: AUTH_DTO_MESSAGES.EMAIL_REQUIRED })
  @IsEmail({}, { message: AUTH_DTO_MESSAGES.EMAIL_INVALID })
  @MinLength(5, { message: AUTH_DTO_MESSAGES.EMAIL_MIN })
  @MaxLength(50, { message: AUTH_DTO_MESSAGES.EMAIL_MAX })
  @Matches(/^\S+$/, { message: AUTH_DTO_MESSAGES.EMAIL_NO_SPACES })
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  email!: string;

  @ApiProperty({ example: 'meu_usuario', minLength: 3, maxLength: 30 })
  @IsNotEmpty({ message: AUTH_DTO_MESSAGES.USERNAME_REQUIRED })
  @IsString()
  @MinLength(3, { message: AUTH_DTO_MESSAGES.USERNAME_MIN })
  @MaxLength(30, { message: AUTH_DTO_MESSAGES.USERNAME_MAX })
  @Matches(/^[a-zA-Z0-9_.]+$/, { message: AUTH_DTO_MESSAGES.USERNAME_CHARS })
  @Matches(/^(?![._]).*(?<![._])$/, { message: AUTH_DTO_MESSAGES.USERNAME_EDGES })
  @Matches(/^\S+$/, { message: AUTH_DTO_MESSAGES.USERNAME_NO_SPACES })
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  username!: string;

  @ApiProperty({ example: 'Senha123!', minLength: 8, maxLength: 20 })
  @IsNotEmpty({ message: AUTH_DTO_MESSAGES.PASSWORD_REQUIRED })
  @IsString()
  @MinLength(8, { message: AUTH_DTO_MESSAGES.PASSWORD_MIN })
  @MaxLength(20, { message: AUTH_DTO_MESSAGES.PASSWORD_MAX })
  @Matches(/[A-Z]/, { message: AUTH_DTO_MESSAGES.PASSWORD_UPPERCASE })
  @Matches(/[a-z]/, { message: AUTH_DTO_MESSAGES.PASSWORD_LOWERCASE })
  @Matches(/[0-9]/, { message: AUTH_DTO_MESSAGES.PASSWORD_NUMBER })
  @Matches(/[^A-Za-z0-9]/, { message: AUTH_DTO_MESSAGES.PASSWORD_SPECIAL })
  password!: string;

  @ApiProperty({ example: 'Senha123!', description: 'Deve ser igual ao campo password' })
  @IsNotEmpty({ message: AUTH_DTO_MESSAGES.CONFIRM_REQUIRED })
  @IsString()
  @MinLength(8, { message: AUTH_DTO_MESSAGES.CONFIRM_MIN })
  @MaxLength(20, { message: AUTH_DTO_MESSAGES.CONFIRM_MAX })
  @Match('password', { message: AUTH_DTO_MESSAGES.CONFIRM_MISMATCH })
  confirmPassword!: string;

  @ApiProperty({ example: 'João Silva', minLength: 2, maxLength: 100 })
  @IsNotEmpty({ message: AUTH_DTO_MESSAGES.DISPLAY_NAME_REQUIRED })
  @IsString()
  @MinLength(2, { message: AUTH_DTO_MESSAGES.DISPLAY_NAME_MIN })
  @MaxLength(100, { message: AUTH_DTO_MESSAGES.DISPLAY_NAME_MAX })
  @Transform(({ value }: { value: string }) => {
    if (typeof value !== 'string') return value;
    return value
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  })
  displayName!: string;
}
