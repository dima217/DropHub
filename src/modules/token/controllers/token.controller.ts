import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TokenService, TokenPayload } from '../services/token.service';

@Controller()
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @MessagePattern('token.validate')
  async validateToken(@Payload() data: { token: string }): Promise<TokenPayload> {
    return this.tokenService.validateToken(data.token);
  }
}
