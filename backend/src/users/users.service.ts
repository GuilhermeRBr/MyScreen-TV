import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { USERS_MESSAGES } from './messages/users.messages';

type SafeUser = {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string): Promise<SafeUser & { _count: { following: number; followers: number } }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { following: true, followers: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(USERS_MESSAGES.USER_NOT_FOUND);
    }

    return user;
  }

  async getPublicProfile(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        _count: {
          select: { following: true, followers: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(USERS_MESSAGES.USER_NOT_FOUND);
    }

    return user;
  }

  async updateProfile(
    userId: string,
    data: { displayName?: string; bio?: string; avatarUrl?: string },
  ): Promise<SafeUser> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async follow(followerId: string, targetUsername: string) {
    const target = await this.prisma.user.findUnique({
      where: { username: targetUsername },
      select: { id: true },
    });

    if (!target) {
      throw new NotFoundException(USERS_MESSAGES.USER_NOT_FOUND);
    }

    if (target.id === followerId) {
      throw new BadRequestException(USERS_MESSAGES.CANNOT_FOLLOW_SELF);
    }

    await this.prisma.follow.upsert({
      where: {
        followerId_followingId: {
          followerId,
          followingId: target.id,
        },
      },
      create: { followerId, followingId: target.id },
      update: {},
    });

    return { following: true };
  }

  async unfollow(followerId: string, targetUsername: string) {
    const target = await this.prisma.user.findUnique({
      where: { username: targetUsername },
      select: { id: true },
    });

    if (!target) {
      throw new NotFoundException(USERS_MESSAGES.USER_NOT_FOUND);
    }

    await this.prisma.follow.deleteMany({
      where: { followerId, followingId: target.id },
    });

    return { following: false };
  }
}
