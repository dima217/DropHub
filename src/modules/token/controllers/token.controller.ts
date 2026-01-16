import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { TokenService } from '../services/token.service';
import { GenerateTokenDto } from '../dto/generate-token.dto';
import { RevokeTokenDto } from '../dto/revoke-token.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard)
@Controller('/token')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}
  @Post('/generate')
  async generatePublicLink(@Body() generateTokenDto: GenerateTokenDto) {
    const token = await this.tokenService.generatePublicLink(generateTokenDto);
    return { success: true, token: token };
  }

  @Post('/revoke')
  async revokeToken(@Body() revokeTokenDto: RevokeTokenDto) {
    await this.tokenService.revokeToken(revokeTokenDto.token);
  }
}
