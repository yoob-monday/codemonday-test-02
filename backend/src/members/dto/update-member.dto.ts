import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { MemberStatus, MemberTier } from '../entities/member.entity';

export class UpdateMemberDto {
  @ApiPropertyOptional({ example: 'Alice Johnson' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'alice@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+66812345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ enum: MemberTier, example: MemberTier.STUDENT })
  @IsOptional()
  @IsEnum(MemberTier)
  tier?: MemberTier;

  @ApiPropertyOptional({ enum: MemberStatus, example: MemberStatus.ACTIVE })
  @IsOptional()
  @IsEnum(MemberStatus)
  status?: MemberStatus;
}
