import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MaxLength, MinLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { AUTH_DTO_MESSAGES } from '../messages/auth.dto.messages';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'usuario@email.com' })
  @IsNotEmpty({ message: AUTH_DTO_MESSAGES.EMAIL_REQUIRED })
  @IsEmail({}, { message: AUTH_DTO_MESSAGES.EMAIL_INVALID })
  @MinLength(5, { message: AUTH_DTO_MESSAGES.EMAIL_MIN })
  @MaxLength(50, { message: AUTH_DTO_MESSAGES.EMAIL_MAX })
  @Matches(/^\S+$/, { message: AUTH_DTO_MESSAGES.EMAIL_NO_SPACES })
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  email!: string;
}
