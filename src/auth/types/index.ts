export interface JwtPayload {
  id: number;
}

export interface UserPayload {
  id: number;
  role: string;
  profileId: number;
}
