import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateMemberDto {
  @ApiProperty({ example: 'Alice Johnson' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'alice@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '+66812345678' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ example: 'securepass123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}
