import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateMemberDto } from '../members/dto/create-member.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthGuard } from './guards/auth.guard';
import { AuthUser } from './interfaces/auth-user.interface';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Sign up as a library member' })
  @ApiBody({
    type: CreateMemberDto,
    examples: {
      default: {
        summary: 'Member signup example',
        value: {
          name: 'Alice Johnson',
          email: 'alice@example.com',
          phone: '+66812345678',
          password: 'securepass123',
        },
      },
    },
  })
  signup(@Body() createMemberDto: CreateMemberDto) {
    return this.authService.signup(createMemberDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login as a member or librarian' })
  @ApiBody({
    type: LoginDto,
    examples: {
      member: {
        summary: 'Member login example',
        value: {
          identifier: 'alice@example.com',
          password: 'securepass123',
        },
      },
      librarian: {
        summary: 'Librarian login example',
        value: {
          identifier: 'librarian',
          password: 'change-me-please',
        },
      },
    },
  })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the current authenticated user' })
  me(@CurrentUser() user: AuthUser) {
    return user;
  }
}
