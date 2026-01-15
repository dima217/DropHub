import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class FileClientService {
  constructor(@Inject('FILE_SERVICE') private readonly fileClient: ClientProxy) {}

  async createFileMeta(data: {
    originalName: string;
    key: string;
    size: number;
    mimeType: string;
    uploaderIp?: string;
  }) {
    return firstValueFrom(this.fileClient.send('file.create', data));
  }

  async getFileById(fileId: string) {
    return firstValueFrom(this.fileClient.send('file.getById', { fileId }));
  }

  async getFileByUploadId(uploadId: string) {
    return firstValueFrom(this.fileClient.send('file.getByUploadId', { uploadId }));
  }

  async getFilesByRoom(roomId: string, userId: number) {
    return firstValueFrom(this.fileClient.send('file.getByRoom', { roomId, userId }));
  }

  async deleteFiles(fileIds: string[]) {
    return firstValueFrom(this.fileClient.send('file.delete', { fileIds }));
  }

  // Upload operations
  async uploadFileToRoom(data: {
    fileSize: number;
    mimeType: string;
    uploaderIp?: string;
    originalName: string;
    userId: number;
    roomId: string;
  }) {
    return firstValueFrom(this.fileClient.send('file.uploadToRoom', data));
  }

  async uploadFileToStorage(data: {
    fileSize: number;
    mimeType: string;
    uploaderIp?: string;
    originalName: string;
    userId: number;
    storageId: string;
  }) {
    return firstValueFrom(this.fileClient.send('file.uploadToStorage', data));
  }

  async uploadFileByToken(data: {
    originalName: string;
    fileSize: number;
    mimeType: string;
    uploaderIp?: string;
    uploadToken: string;
  }) {
    return firstValueFrom(this.fileClient.send('file.uploadByToken', data));
  }

  // Download operations
  async getDownloadLink(fileId: string, userId: number) {
    return firstValueFrom(this.fileClient.send('file.getDownloadLink', { fileId, userId }));
  }

  async getDownloadLinkByToken(downloadToken: string) {
    return firstValueFrom(this.fileClient.send('file.getDownloadLinkByToken', { downloadToken }));
  }

  async getStream(key: string) {
    return firstValueFrom(this.fileClient.send('file.getStream', { key }));
  }

  // Multipart upload
  async initMultipartUpload(params: any, ip: string) {
    return firstValueFrom(this.fileClient.send('file.multipart.init', { params, ip }));
  }

  async completeMultipartUpload(data: any) {
    return firstValueFrom(this.fileClient.send('file.multipart.complete', data));
  }

  async getExpiredFiles(beforeDate?: Date) {
    return firstValueFrom(this.fileClient.send('file.getExpired', { beforeDate }));
  }

  async deleteFileCompletely(storedName: string) {
    return firstValueFrom(this.fileClient.send('file.deleteCompletely', { storedName }));
  }
}
