import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { S3Service } from 'src/modules/s3/s3.service';
import { GetObjectCommandInput } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { FilesService } from '../file.service';
import { S3_BUCKET_TOKEN } from 'src/modules/s3/s3.tokens';
import { UniversalPermissionService } from 'src/modules/permission/services/permission.service';
import { TokenService } from 'src/modules/token/services/token.service';
import { AccessRole, ResourceType } from '../../../permission/entities/permission.entity';
import { Readable } from 'stream';
import { S3ReadStream } from '../../utils/s3-read-stream';

interface AuthenticatedDownloadParams {
  fileId: string;
  userId: number;
}

interface DownloadByTokenParams {
  downloadToken: string;
}

@Injectable()
export class DownloadService {
  constructor(
    private readonly s3Service: S3Service,
    private readonly permissionService: UniversalPermissionService,
    private readonly tokenService: TokenService,
    private readonly fileService: FilesService,
    private readonly S3ReadStream: S3ReadStream,
    @Inject(S3_BUCKET_TOKEN) private readonly bucket: string,
  ) {}

  private async generatePresignedUrl(key: string): Promise<string> {
    const downloadData: GetObjectCommandInput = {
      Bucket: this.bucket,
      Key: key,
    };
    const command = this.s3Service.createGetResourceCommand(downloadData);
    return getSignedUrl(this.s3Service.client, command, { expiresIn: 60 });
  }

  private async verifyAndGetFile(fileId: string, userId?: number) {
    const file = await this.fileService.getFileById(fileId);
    if (!file) {
      throw new NotFoundException('File does not exist.');
    }
    if (userId !== undefined) {
      await this.permissionService.verifyUserAccess(userId, fileId, ResourceType.FILE, [
        AccessRole.ADMIN,
        AccessRole.READ,
        AccessRole.WRITE,
      ]);
    }

    return file;
  }

  async getDownloadLinkAuthenticated(params: AuthenticatedDownloadParams): Promise<string> {
    const { fileId, userId } = params;

    const file = await this.verifyAndGetFile(fileId, userId);

    return this.generatePresignedUrl(file.key);
  }

  async downloadFileByToken(params: DownloadByTokenParams): Promise<string> {
    const { downloadToken } = params;

    if (!downloadToken) {
      throw new BadRequestException('Download token is required.');
    }

    const payload = await this.tokenService.validateToken(downloadToken);

    if (!payload || !payload.resourceId || payload.resourceType !== 'file') {
      throw new UnauthorizedException('Invalid or expired download token.');
    }

    const fileId = payload.resourceId;
    const file = await this.verifyAndGetFile(fileId);

    return this.generatePresignedUrl(file.key);
  }

  async getStream(key: string): Promise<Readable> {
    if (!key) {
      throw new BadRequestException('S3 key is required');
    }

    return this.S3ReadStream.download(key);
  }

  // deprecated
  async getDownloadLink(fileId: string): Promise<string> {
    const file = await this.fileService.getFileById(fileId);
    return this.generatePresignedUrl(file.key);
  }
}
