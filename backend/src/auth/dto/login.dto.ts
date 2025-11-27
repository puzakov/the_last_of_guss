import { IsString, MinLength, Matches } from 'class-validator';

export class LoginDto {
  @IsString({ message: 'Имя пользователя должно быть строкой' })
  @MinLength(1, { message: 'Имя пользователя не может быть пустым' })
  @Matches(/^[a-zA-Z0-9]+$/, {
    message: 'Имя пользователя должно содержать только буквы и цифры',
  })
  username!: string;

  @IsString({ message: 'Пароль должен быть строкой' })
  @MinLength(8, { message: 'Пароль должен быть не менее 8 символов' })
  @Matches(/^[a-zA-Z0-9]+$/, {
    message: 'Пароль должен содержать только буквы и цифры без спецсимволов',
  })
  password!: string;
}

