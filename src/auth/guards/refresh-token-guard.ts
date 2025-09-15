import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";

@Injectable()
export class RefreshTokenGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<Request>();

        let token: string | undefined;

        const userAgent = request.headers['user-agent'] || '';
        const accept = request.headers['accept'] || '';
    
        const isBrowser = /Mozilla|Chrome|Safari|Firefox|Edge|Opera/i.test(userAgent) 
        && accept.includes('text/html');
    
        if (isBrowser) {
          token = request.cookies?.['refreshToken'];
        } else {
            const authHeader = request.headers['authorization'];
            if (authHeader?.startsWith('Bearer ')) {
                token = authHeader.slice(7);
            }
        }

        if (!token) {
            throw new UnauthorizedException('No refresh token provided');
        }

        (request as any).refreshToken = token;
        (request as any).isBrowser = isBrowser;
        
        return true;
    }
}