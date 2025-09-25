import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Profile } from '../entities/profile.entity';
import { ImageService } from 'src/modules/images/image.service';
import { UserUpdateProfileDTO } from '../dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    private readonly imageService: ImageService,
  ) {}

  async createProfileTransactional(
    data: Partial<Profile>,
    manager: EntityManager
  ): Promise<Profile> {
    const profile = manager.create(Profile, data);
    return manager.save(profile);
  }

  async updateProfile(profile: Profile, dto: UserUpdateProfileDTO): Promise<Profile> {
    if (dto.avatarUrl && profile.avatarUrl && dto.avatarUrl !== profile.avatarUrl) {
      await this.imageService.deleteFileFromStorage(profile.avatarUrl);
    }
    if (dto.avatarUrl) profile.avatarUrl = dto.avatarUrl;

    if (dto.firstName !== undefined) profile.firstName = dto.firstName;
    if (dto.lastName !== undefined) profile.lastName = dto.lastName;

    return this.profileRepository.save(profile);
  }

  async getProfileById(id: number): Promise<Profile> {
    const profile = await this.profileRepository.findOne({ where: { id } });
    if (!profile) throw new NotFoundException(`Profile with ID ${id} not found`);
    return profile;
  }
}
