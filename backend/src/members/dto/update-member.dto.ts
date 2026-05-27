import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { MemberStatus, MemberTier } from '../entities/member.entity';

export class UpdateMemberDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(MemberTier)
  tier?: MemberTier;

  @IsOptional()
  @IsEnum(MemberStatus)
  status?: MemberStatus;
}
