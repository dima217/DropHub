import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Res,
  Put,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Query,
  Req,
  HttpStatus,
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { UsersService } from '../services/user.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { User } from '../entities/user.entity';
import { CreateUserResponse } from '../types/createUserResponse';
import { JwtAuthGuard } from 'src/auth/guards/jwt-guard';
import { RolesGuard } from 'src/auth/guards/roles-guard';
import { Roles } from 'src/auth/decorators/role.decorator';
import { UserUpdateProfileDTO } from '../dto/update-profile.dto';
import type { JwtAuthRequest } from 'src/types/express';
import { UpdateBalanceDto } from '../dto/update-user-balance.dto';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UsersService) {}

  //Public endpoint
  @Post()
  @UsePipes(new ValidationPipe())
  @ApiOperation({ summary: 'Create a user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'User successfully created',
    type: User,
  })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async create(
    @Body() createUserDto: CreateUserDto,
  ): Promise<CreateUserResponse> {
    return await this.userService.createUser(createUserDto);
  }

  //Admin endpoint
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Successful request', type: [User] })
  @Roles('admin')
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 100,
    @Res() res: FastifyReply,
  ) {
    const [users, total] = await this.userService.findAllPaginated(page, limit);

    const start = (page - 1) * limit;
    const end = start + users.length - 1;

    res.header('Content-Range', `users ${start}-${end}/${total}`);
    res.header('Access-Control-Expose-Headers', 'Content-Range');
    res.status(HttpStatus.OK).send(users);
  }

  //Admin endpoint
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiParam({ name: 'id', type: 'integer', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Successful request', type: User })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Roles('admin')
  findOne(@Param('id') id: string) {
    return this.userService.getUserById(+id);
  }

  //User endpoint
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Put(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', type: 'integer', description: 'User ID' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'User successfully updated',
    type: User,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Roles('admin')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.updateUser(+id, updateUserDto);
  }

  @Put('/profile/update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  async updateProfile(
    @Req() req: JwtAuthRequest,
    @Body() dto: UserUpdateProfileDTO,
  ) {
    return this.userService.updateUserProfile(req.user.id, dto);
  }

  @Put('/balance/update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'admin')
  async updateUserBalance(
    @Req() req: JwtAuthRequest,
    @Body() body: UpdateBalanceDto,
  ) {
    return this.userService.updateUserBalance(req.user.id, body.balance);
  }

  //Admin endpoint
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiParam({ name: 'id', type: 'integer', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
