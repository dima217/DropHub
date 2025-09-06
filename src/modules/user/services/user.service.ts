import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { CacheService } from 'src/cache/cache.service';
import { User, UserRole } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { CreateUserResponse } from '../types/createUserResponse';
import { UpdateUserResetDto } from '../dto/update-user-reset.dto';
import { ImageService } from 'src/modules/images/image.service';
import { UserUpdateProfileDTO } from '../dto/update-profile.dto';

const CACHE_TTL = 300;
const USER_SELECT_FIELDS = ['id', 'email', 'username', 'balance', 'role', 'avatarUrl'] as const;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly cacheService: CacheService,
    private readonly jwtService: JwtService,
    private readonly imageService: ImageService,
  ) {}

  async findAllPaginated(page: number, limit: number): Promise<[User[], number]> {
    const cacheKey = `users:page=${page}&limit=${limit}`;
    
    return this.cacheService.cacheWrapper(cacheKey, async () => {
      return this.usersRepository.findAndCount({
        skip: (page - 1) * limit,
        take: limit,
        order: { id: 'ASC' }
      });
    }, CACHE_TTL);
  }

  async createUser(createUserDto: CreateUserDto): Promise<CreateUserResponse> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
      select: ['id']
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const user = this.usersRepository.create({
      ...createUserDto,
      password: await argon2.hash(createUserDto.password),
      role: UserRole.USER,
      avatarUrl: createUserDto.avatarUrl,
    });

    await this.usersRepository.manager.transaction(async (em) => {
      await em.save(user);
    });

    return {
      user,
      token: this.jwtService.sign({
        id: user.id,
        email: user.email,
        role: user.role,
      })
    };
  }

  async getUserById(id: number): Promise<User | null> {
    const cacheKey = `user:${id}`;
    
    return this.cacheService.cacheWrapper(cacheKey, async () => {
      return this.usersRepository.findOne({
        where: { id },
        select: [...USER_SELECT_FIELDS]
      });
    }, CACHE_TTL);
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      select: [...USER_SELECT_FIELDS, 'password']
    });
  }

  async updateUser(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const updatedUser = await this.usersRepository.save({ ...user, ...dto });
    
    await this.cacheService.deleteByPattern(`user:${id}`);
    await this.cacheService.deleteByPattern('users:*');

    return updatedUser;
  }

  async updateUserProfile(id: number, userUpdateProfileDTO: UserUpdateProfileDTO): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
  
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  
    const isAvatarChanged = userUpdateProfileDTO.avatarUrl && userUpdateProfileDTO.avatarUrl !== user.avatarUrl;
  
    if (isAvatarChanged && user.avatarUrl) {
      await this.imageService.deleteFileFromStorage(user.avatarUrl);
    }
  
    if (userUpdateProfileDTO.username)
    user.username = userUpdateProfileDTO.username;
    if (userUpdateProfileDTO.avatarUrl) {
      user.avatarUrl = userUpdateProfileDTO.avatarUrl;
    }
    const savedUser = await this.usersRepository.save(user);
  
    await this.cacheService.deleteByPattern(`user:${id}`);
  
    return savedUser;
  }

  async updatePassword(id: number, newPassword: string): Promise<void> {
    await this.usersRepository.update(id, {
      password: await argon2.hash(newPassword)
    });
    
    await this.cacheService.deleteByPattern(`user:${id}`);
  }

  async updateUserToken(id: number, dto: UpdateUserResetDto): Promise<void> {
    await this.usersRepository.update(id, {
      resetPasswordToken: dto.resetPasswordToken,
      tokenExpiredDate: dto.tokenExpiredDate,
    });
    
    await this.cacheService.deleteByPattern(`user:${id}`);
  }

  async remove(id: number): Promise<void> {
    await this.usersRepository.delete(id);
    await this.cacheService.deleteByPattern(`user:${id}`);
    await this.cacheService.deleteByPattern('users:*');
  }
}