import { IsOptional, IsString } from "class-validator";

export class UserUpdateProfileDTO {
      @IsOptional() 
      @IsString()
      username?: string;
    
      @IsOptional() 
      @IsString()
      avatarUrl?: string;
}