import { IsArray, IsString } from 'class-validator';

export class ModifyFilesDto {
    @IsString()
    userId: string;

    @IsArray()
    @IsString({each: true})
    keys: string[];
}