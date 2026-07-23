import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import Redis from 'ioredis';
import { LoginDto } from './dto/login.dto';

// Import the client from your custom generated path
import { PrismaClient } from '../../generated/prisma/client';

// Set up the native Postgres connection pool
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter }); 

// Connects to the Redis container
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379'); 

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async login(loginDto: LoginDto) {
    const user = await prisma.user.findUnique({ where: { email: loginDto.email } });
    
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
    const decoded: any = this.jwtService.decode(token);
    const timeToLive = decoded.exp - Math.floor(Date.now() / 1000);
    
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