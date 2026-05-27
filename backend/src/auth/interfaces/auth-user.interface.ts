import { MemberRole } from '../../members/entities/member.entity';

export interface AuthUser {
  sub: string;
  email?: string;
  username?: string;
  role: MemberRole;
  name: string;
  membershipNumber?: string;
}
