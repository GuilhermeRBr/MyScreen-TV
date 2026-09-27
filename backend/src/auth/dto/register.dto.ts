import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'usuario@email.com' })
  @IsEmail({}, { message: 'Email inválido' })
  email!: string;

  @ApiProperty({ example: 'meu_usuario', minLength: 3, maxLength: 30 })
  @IsString()
  @MinLength(3, { message: 'Username deve ter pelo menos 3 caracteres' })
  @MaxLength(30, { message: 'Username deve ter no máximo 30 caracteres' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username só pode conter letras, números e underscore',
  })
  username!: string;

  @ApiProperty({ example: 'minhasenha123', minLength: 8, maxLength: 100 })
  @IsString()
  @MinLength(8, { message: 'Senha deve ter pelo menos 8 caracteres' })
  @MaxLength(100)
  password!: string;

  @ApiProperty({ example: 'João Silva', minLength: 2, maxLength: 60 })
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  displayName!: string;
}
