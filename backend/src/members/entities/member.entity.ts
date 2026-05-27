export enum MemberStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

export enum MemberRole {
  MEMBER = 'member',
  LIBRARIAN = 'librarian',
}

export enum MemberTier {
  STUDENT = 'Student',
  FACULTY = 'Faculty',
  COMMUNITY = 'Community',
}

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  tier: MemberTier;
  membershipNumber: string;
  passwordHash?: string;
  status: MemberStatus;
  role: MemberRole;
  createdAt: Date;
  updatedAt: Date;
  activeLoansCount?: number;
}
