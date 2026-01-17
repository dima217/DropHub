import { UserRole } from "@/modules/user/entities/user.entity";

export interface JwtPayload {
    id: number;
}
export interface UserPayload {
    id: number;
    role: UserRole;
    profileId: number;
  }
  