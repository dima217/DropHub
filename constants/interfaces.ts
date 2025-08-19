export interface UploadInitRequestBody {
    Body: {
        fileSize: number;
    }
  }
  
export interface UploadInitMultipart {
    Body: {
        fileName: string;
        totalParts: number;
    }
}
  
export interface UploadComplete {
    Body: {
      uploadId: string;
      key: string;
      parts: { ETag: string; PartNumber: number }[]; 
      roomId: string;
      fileName: string;
      fileSize: number;
      fileType: string;
    }
}
  
export interface downloadInterface {
    Body: {
      key: string, 
    }
}

export interface DeleteFileBody {
    files: string[];
}

export interface DeleteRoomBody {
    roomId: string;
}

export interface GetFilesBody {
    roomId: string;
}
  