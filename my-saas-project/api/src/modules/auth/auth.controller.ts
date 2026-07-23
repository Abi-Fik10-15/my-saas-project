import { Controller, Post, Body, Req, UseGuards, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/role.decorator';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('login')
    login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    logout(@Req() req: any){
        const token = req.headers.authorization.split(' ')[1];
        return this.authService.logout(token);
    }

    @Get('admin-dashboard')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    getAdminData(){
        return { secret: 'Highly Confidential admin data'};
    }
}