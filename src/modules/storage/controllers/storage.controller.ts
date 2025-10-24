import {
  Controller,
  Post,
  Req,
  UseGuards,
  Body,
  BadRequestException,
  Get,
  Param,
} from '@nestjs/common';
import { StorageService } from '../services/storage.service';
import { AuthGuard } from '@nestjs/passport';
import type { RequestWithUser } from 'src/types/express';
import { GetStorageDto } from '../dto/get-storage.dto';
import { GetStructureDto } from '../dto/get-structure.dto';
import { DeleteItemDto } from '../dto/delete-item.dto';

@Controller('storage')
@UseGuards(AuthGuard)
export class UserStorageController {
  constructor(private readonly userStorageService: StorageService) {}

  @Post('/')
  async getUserStorages(@Req() req: RequestWithUser) {
    return this.userStorageService.getStoragesByUserId(req.user.id);
  }

  @Post('full-tree')
  async getFullStorageStructure(@Body() body: GetStorageDto, @Req() req: RequestWithUser) {
    if (!body.storageId) {
      throw new BadRequestException('Storage ID is required.');
    }
    return this.userStorageService.getFullStorageStructure(body.storageId, req.user.id);
  }

  @Post('structure')
  async getStorageStructure(@Body() body: GetStructureDto, @Req() req: RequestWithUser) {
    if (!body.storageId) {
      throw new BadRequestException('Storage ID is required.');
    }

    const params = {
      storageId: body.storageId,
      parentId: body.parentId !== undefined ? body.parentId : null,
      userId: req.user.id,
    };

    return this.userStorageService.getStorageStructure(params);
  }

  @Post('delete-item')
  async deleteStorageItem(@Body() body: DeleteItemDto, @Req() req: RequestWithUser) {
    if (!body.storageId || !body.itemId) {
      throw new BadRequestException('Both Storage ID and Item ID are required.');
    }

    const params = {
      storageId: body.storageId,
      itemId: body.itemId,
      userId: req.user.id,
    };

    return this.userStorageService.deleteStorageItem(params);
  }
}

@Controller('public/storage')
export class PublicStorageController {
  constructor(private readonly userStorageService: StorageService) {}

  @Get(':token')
  async getItemByToken(@Param('token') token: string) {
    return this.userStorageService.getStorageItemByToken(token);
  }
}
