import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {


    @ApiProperty({ example: 'admin@acmecorp.com', description: 'User email address'})
    email!: string;

    @ApiProperty({example: 'SuperSecret123!', description: 'User password'})
    password!: string;
}