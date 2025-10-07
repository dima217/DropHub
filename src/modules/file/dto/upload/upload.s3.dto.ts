import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'LocationRequiredIfNoToken', async: false })
export class LocationRequiredIfNoTokenConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const object = args.object as UploadToS3Dto;
    if (object.uploadToken) {
      return true;
    }
    return !!object.roomId || !!object.storageId;
  }
  defaultMessage(args: ValidationArguments) {
    return 'If "uploadToken" is not provided, one of "roomId" or "storageId" must be present.';
  }
}

export class UploadToS3Dto {
  @IsString()
  originalName: string;

  @IsNumber()
  fileSize: number;

  @IsString()
  mimeType: string;

  @IsOptional()
  @IsUUID('4')
  roomId?: string;

  @IsOptional()
  @IsUUID('4')
  storageId?: string;

  @IsOptional()
  @IsString()
  uploadToken?: string;

  @IsString()
  uploaderIp?: string;
}
