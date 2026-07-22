import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class UsersService {

    async create(createUserDto: CreateUserDto){
        return prisma.user.create({
            data: createUserDto,
        });
    }

    async findAll(){
        return prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
            },
        });
    }

    async findOne(id: number){
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
            },
        });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async remove(id: number){
        try{
            return await prisma.user.delete({
                where: { id }
            });

        } catch (error) {
            throw new NotFoundException('User not found');

        }
    }
}