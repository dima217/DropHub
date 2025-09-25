export enum StorageRole {
    READ = 'read',
    WRITE = 'write',
    ADMIN = 'admin',
}

export interface PermissionData {
    role: StorageRole,
    userId: number,
    storageId: string
}


  