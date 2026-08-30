import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsString()
  @MinLength(3, { message: 'Username deve ter pelo menos 3 caracteres' })
  @MaxLength(30, { message: 'Username deve ter no máximo 30 caracteres' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username só pode conter letras, números e underscore',
  })
  username: string;

  @IsString()
  @MinLength(8, { message: 'Senha deve ter pelo menos 8 caracteres' })
  @MaxLength(100)
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(60)
  displayName: string;
}
