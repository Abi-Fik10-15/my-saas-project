import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import Redis from 'ioredis';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterTenantDto } from './dto/register-tenant.dto';

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

  // --- 1. NEW: Transactional Tenant & Admin Registration ---
  async registerTenant(dto: RegisterTenantDto) {
    // Check if organization slug is already taken
    const existingOrg = await prisma.organization.findUnique({
      where: { slug: dto.organizationSlug },
    });
    if (existingOrg) {
      throw new ConflictException('Organization slug is already taken.');
    }

    // Check if admin email is already taken
    const existingUser = await prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email is already registered.');
    }

    // Hash password with salt rounds = 10
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Execute Organization and User creation atomically
    const [organization, adminUser] = await prisma.$transaction(async (tx) => {
      const newOrg = await tx.organization.create({
        data: {
          name: dto.organizationName,
          slug: dto.organizationSlug,
        },
      });

      const newUser = await tx.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          password: hashedPassword,
          role: 'ADMIN', // First user is always the organization Admin
          organizationId: newOrg.id,
        },
      });

      return [newOrg, newUser];
    });

    return {
      message: 'Tenant onboarded successfully',
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      },
      admin: {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
      },
    };
  }

  // --- 2. Existing Login Method ---
  async login(loginDto: LoginDto) {
    const user = await prisma.user.findUnique({ where: { email: loginDto.email } });
    
    // Note: When testing accounts created via registerTenant(), uncomment the bcrypt line below!
    // const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    const isPasswordValid = loginDto.password === user?.password; 

    if (!user || !isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return { access_token: accessToken };
  }

  // --- 3. Existing Logout Method ---
  async logout(token: string) {
    const decoded: any = this.jwtService.decode(token);
    const timeToLive = decoded.exp - Math.floor(Date.now() / 1000);
    
    if (timeToLive > 0) {
      await redis.set(`blacklist:${token}`, 'true', 'EX', timeToLive);
    }
    return { message: 'Successfully logged out' };
  }

  // --- 4. Existing Blacklist Checker ---
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    return isBlacklisted === 'true';
  }
}