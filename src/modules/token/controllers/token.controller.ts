import { Body, Controller, Post } from '@nestjs/common';
import { TokenService } from '../services/token.service';
import { GenerateTokenDto } from '../dto/generate-token.dto';
import { RevokeTokenDto } from '../dto/revoke-token.dto';

@Controller('/token')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}
  @Post('/generate')
  async generateToken(@Body() generateTokenDto: GenerateTokenDto) {
    const token = await this.tokenService.generateToken(generateTokenDto);
    return { success: true, token: token };
  }

  @Post('/revoke')
  async revokeToken(@Body() revokeTokenDto: RevokeTokenDto) {
    await this.tokenService.revokeToken(revokeTokenDto.token);
  }
}
