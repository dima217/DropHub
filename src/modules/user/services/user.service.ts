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
import { UpdateUserDto } from '../dto/update-user.dto';
import { CreateUserResponse } from '../types/createUserResponse';
import { UpdateUserResetDto } from '../dto/update-user-reset.dto';
import { ImageService } from 'src/modules/images/image.service';
import { UserUpdateProfileDTO } from '../dto/update-profile.dto';
import { CreateUserDto } from '../dto/create-user.dto';

const CACHE_TTL = 300;
const USER_SELECT_FIELDS = ['id', 'email', 'firstName', 'role', 'avatarUrl'] as const;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly cacheService: CacheService,
    private readonly jwtService: JwtService,
    private readonly imageService: ImageService,
  ) {}

  async findAllPaginated(page: number, limit: number): Promise<[User[], number]> {
    const cacheKey = `users:page=${page}&limit=${limit}`;
    
    return this.cacheService.cacheWrapper(cacheKey, async () => {
      return this.userRepository.findAndCount({
        skip: (page - 1) * limit,
        take: limit,
        order: { id: 'ASC' }
      });
    }, CACHE_TTL);
  }

  async getUserById(id: number): Promise<User | null> {
    const cacheKey = `user:${id}`;
    
    return this.cacheService.cacheWrapper(cacheKey, async () => {
      return this.userRepository.findOne({
        where: { id },
        select: [...USER_SELECT_FIELDS]
      });
    }, CACHE_TTL);
  }

  findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      select: [...USER_SELECT_FIELDS, 'password']
    });
  }

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const user = this.userRepository.create({
      ...createUserDto,
      password: await argon2.hash(createUserDto.password),
    });

    return this.userRepository.save(user);
  }

  async updateUser(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const updatedUser = await this.userRepository.save({ ...user, ...dto });
    
    await this.cacheService.deleteByPattern(`user:${id}`);
    await this.cacheService.deleteByPattern('users:*');

    return updatedUser;
  }

  async updateUserProfile(id: number, userUpdateProfileDTO: UserUpdateProfileDTO): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });
  
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  
    const isAvatarChanged = userUpdateProfileDTO.avatarUrl && userUpdateProfileDTO.avatarUrl !== user.avatarUrl;
  
    if (isAvatarChanged && user.avatarUrl) {
      await this.imageService.deleteFileFromStorage(user.avatarUrl);
    }
  
    if (userUpdateProfileDTO.username)
    user.firstName = userUpdateProfileDTO.username;
    if (userUpdateProfileDTO.avatarUrl) {
      user.avatarUrl = userUpdateProfileDTO.avatarUrl;
    }
    const savedUser = await this.userRepository.save(user);
  
    await this.cacheService.deleteByPattern(`user:${id}`);
  
    return savedUser;
  }

  async updatePassword(id: number, newPassword: string): Promise<void> {
    await this.userRepository.update(id, {
      password: await argon2.hash(newPassword)
    });
    
    await this.cacheService.deleteByPattern(`user:${id}`);
  }

  async updateUserToken(id: number, dto: UpdateUserResetDto): Promise<void> {
    await this.userRepository.update(id, {
      resetPasswordToken: dto.resetPasswordToken,
      tokenExpiredDate: dto.tokenExpiredDate,
    });
    
    await this.cacheService.deleteByPattern(`user:${id}`);
  }

  async updateRefreshToken(userId: number, refreshToken: string | null): Promise<void> {
    await this.userRepository.update(userId, { refreshToken });
  }

  async incrementTokenVersion(userId: number): Promise<void> {
    const user = await this.getUserById(userId);
    if (user) {
      user.tokenVersion++;
      await this.userRepository.save(user);
    }
  }

  async remove(id: number): Promise<void> {
    await this.userRepository.delete(id);
    await this.cacheService.deleteByPattern(`user:${id}`);
    await this.cacheService.deleteByPattern('users:*');
  }
}