import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { CreateMemberDto } from '../members/dto/create-member.dto';
import { MemberRole } from '../members/entities/member.entity';
import { MembersService } from '../members/members.service';
import { LoginDto } from './dto/login.dto';
import { AuthUser } from './interfaces/auth-user.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly membersService: MembersService,
  ) {}

  async signup(createMemberDto: CreateMemberDto) {
    const existingMember = await this.membersService.findByEmail(
      createMemberDto.email,
    );

    if (existingMember) {
      throw new BadRequestException('Email is already registered.');
    }

    const member = await this.membersService.create(createMemberDto);

    return this.buildAuthResponse({
      sub: member.id,
      email: member.email,
      role: member.role,
      name: member.name,
      membershipNumber: member.membershipNumber,
    });
  }

  async login(loginDto: LoginDto) {
    const librarianUsername = this.configService.get<string>(
      'LIBRARIAN_USERNAME',
    );
    const librarianPassword = this.configService.get<string>(
      'LIBRARIAN_PASSWORD',
    );

    if (
      loginDto.identifier === librarianUsername &&
      loginDto.password === librarianPassword
    ) {
      return this.buildAuthResponse({
        sub: 'librarian-env',
        username: librarianUsername,
        role: MemberRole.LIBRARIAN,
        name: 'Librarian',
      });
    }

    const member = await this.membersService.findByEmail(loginDto.identifier);

    if (!member) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const passwordMatches = await bcrypt.compare(
      loginDto.password,
      member.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return this.buildAuthResponse({
      sub: member.id,
      email: member.email,
      role: member.role,
      name: member.name,
      membershipNumber: member.membershipNumber,
    });
  }

  private buildAuthResponse(user: AuthUser) {
    return {
      accessToken: this.jwtService.sign(user),
      user,
    };
  }
}
