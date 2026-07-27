import { Controller, Post, Body, Req, UseGuards, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/role.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('login')
    @ApiOperation({ summary: 'Log a user in and return a JWT'})
    login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Invalidate the current JWT session' })
    logout(@Req() req: any){
        const token = req.headers.authorization.split(' ')[1];
        return this.authService.logout(token);
    }

    @Get('admin-dashboard')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth('JWT-auth') // Tells Swagger to require the JWT token in the UI
    @ApiOperation({ summary: 'Access highly confidential admin data (Admin only)' })
    @ApiResponse({ status: 200, description: 'Successfully retrieved admin data.' })
    @ApiResponse({ status: 401, description: 'Unauthorized. Token is missing, invalid, or expired.' })
    @ApiResponse({ status: 403, description: 'Forbidden. User does not have the required ADMIN role.' })
    getAdminData(){
        return { secret: 'Highly Confidential admin data'};
    }
}