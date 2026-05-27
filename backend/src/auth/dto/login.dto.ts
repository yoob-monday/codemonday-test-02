import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'alice@example.com',
    description: 'Member email or librarian username.',
  })
  @IsString()
  @IsNotEmpty()
  identifier!: string;

  @ApiProperty({ example: 'securepass123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}
