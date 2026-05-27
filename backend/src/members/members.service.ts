import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import {
  Member,
  MemberRole,
  MemberStatus,
  MemberTier,
} from './entities/member.entity';

type MemberRecord = Omit<Member, 'activeLoansCount'> & {
  loans: Array<{ id: string }>;
};

@Injectable()
export class MembersService {
  private readonly memberInclude = {
    loans: {
      where: {
        returnedAt: null,
      },
      select: {
        id: true,
      },
    },
  };

  private readonly memberSelect = {
    id: true,
    name: true,
    email: true,
    phone: true,
    tier: true,
    membershipNumber: true,
    status: true,
    role: true,
    createdAt: true,
    updatedAt: true,
  };

  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const members = (await this.prisma.member.findMany({
      select: {
        ...this.memberSelect,
        ...this.memberInclude,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })) as MemberRecord[];

    return members.map((member) => this.decorateMember(member));
  }

  async findOne(id: string) {
    const member = (await this.prisma.member.findUnique({
      select: {
        ...this.memberSelect,
        ...this.memberInclude,
      },
      where: { id },
    })) as MemberRecord | null;

    if (!member) {
      throw new NotFoundException(`Member with id "${id}" was not found.`);
    }

    return this.decorateMember(member);
  }

  findByEmail(email: string) {
    return this.prisma.member.findUnique({
      where: { email },
    }) as Promise<Member | null>;
  }

  async create(createMemberDto: CreateMemberDto) {
    const totalMembers = await this.prisma.member.count();
    const passwordHash = await bcrypt.hash(createMemberDto.password, 10);

    return this.prisma.member.create({
      select: this.memberSelect,
      data: {
        name: createMemberDto.name,
        email: createMemberDto.email,
        phone: createMemberDto.phone,
        tier: MemberTier.COMMUNITY,
        membershipNumber: `MBR-${String(totalMembers + 1).padStart(4, '0')}`,
        passwordHash,
        status: MemberStatus.ACTIVE,
        role: MemberRole.MEMBER,
      },
    }) as Promise<Member>;
  }

  async update(id: string, updateMemberDto: UpdateMemberDto) {
    await this.findOne(id);

    return this.prisma.member.update({
      select: this.memberSelect,
      where: { id },
      data: updateMemberDto,
    }) as Promise<Member>;
  }

  private decorateMember(member: MemberRecord) {
    return {
      ...member,
      activeLoansCount: member.loans.length,
    };
  }
}
