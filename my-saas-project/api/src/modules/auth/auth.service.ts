import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '../../generated/prisma/client';
import * as bcrypt from 'bcrypt';
import Redis from 'ioredis';
import { LoginDto } from './dto/login.dto';

const prisma = new PrismaClient();
// Connects to the Redis container running on port 6379
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379'); 

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async login(loginDto: LoginDto) {
    const user = await prisma.user.findUnique({ where: { email: loginDto.email } });
    
    // In a real flow, the password in the DB would be hashed during registration
    // const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    const isPasswordValid = loginDto.password === user?.password; 

    if (!user || !isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return { access_token: accessToken };
  }

  async logout(token: string) {
    // Decode token to get expiration time
    const decoded: any = this.jwtService.decode(token);
    const timeToLive = decoded.exp - Math.floor(Date.now() / 1000);
    
    // Add token to Redis blacklist until it expires natively
    if (timeToLive > 0) {
      await redis.set(`blacklist:${token}`, 'true', 'EX', timeToLive);
    }
    return { message: 'Successfully logged out' };
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    return isBlacklisted === 'true';
  }
}