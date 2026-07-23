import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../../modules/auth/auth.service';


@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt'){
    constructor(private authService: AuthService){
        super();
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {

        const isValid = await super.canActivate(context);
        if (!isValid) return false;

        const request = context.switchToHttp().getRequest();
        const token = request.headers.authorization?.split(' ');

        if(token) {
            const isBlacklisted = await this.authService.isTokenBlacklisted(token);
            if (isBlacklisted) throw new UnauthorizedException('Token has benn revoked');
        }
        return true;
    }
}