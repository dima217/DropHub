import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class CentrifugoService {
  private readonly apiUrl = 'http://localhost:8000/api';
  private readonly apiKey = 'test';

  async publish(channel: string, data: Record<string, any>) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/publish`,
        { channel, data },
        { headers: { Authorization: `apikey ${this.apiKey}` } },
      );

      return response.data;
    } catch (error) {
      throw error;
    }
  }
}
