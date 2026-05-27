import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MemberRole } from './entities/member.entity';
import { MembersService } from './members.service';

@ApiTags('Members')
@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my member profile' })
  me(@CurrentUser() user: AuthUser) {
    return this.membersService.findOne(user.sub);
  }

  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberRole.LIBRARIAN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List members' })
  findAll() {
    return this.membersService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberRole.LIBRARIAN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get one member by id' })
  @ApiParam({ name: 'id', example: 'member-uuid-here' })
  findOne(@Param('id') id: string) {
    return this.membersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberRole.LIBRARIAN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a member' })
  @ApiParam({ name: 'id', example: 'member-uuid-here' })
  @ApiBody({
    type: UpdateMemberDto,
    examples: {
      default: {
        summary: 'Update member example',
        value: {
          tier: 'Student',
          status: 'active',
        },
      },
    },
  })
  update(@Param('id') id: string, @Body() updateMemberDto: UpdateMemberDto) {
    return this.membersService.update(id, updateMemberDto);
  }
}
