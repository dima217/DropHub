import { UserPayload } from '@auth/types';
import { Socket } from 'socket.io';
interface AuthHandshake {
  auth: {
    token?: string;
    [key: string]: unknown;
  };

  headers: {
    authorization?: string;
  };
  query: {
    token?: string;
    [key: string]: unknown;
  };
}

interface USocket extends Socket {
  user: UserPayload;
  handshake: AuthHandshake;
}
