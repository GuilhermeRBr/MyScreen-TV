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
  isActive: boolean;
  lastLoginAt: Date | null;
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
        isActive: true,
        lastLoginAt: true,
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
        isActive: true,
        lastLoginAt: true,
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

  async getBannerImages(userId: string): Promise<{ backdropPath: string }[]> {
    const [showBackdrops, movieBackdrops] = await Promise.all([
      this.prisma.userShowSubscription.findMany({
        where: { userId },
        select: { show: { select: { backdropPath: true } } },
        orderBy: { updatedAt: 'desc' },
        take: 20,
      }),
      this.prisma.movieWatch.findMany({
        where: { userId },
        select: { movie: { select: { backdropPath: true } } },
        orderBy: { updatedAt: 'desc' },
        take: 20,
      }),
    ]);

    const images: { backdropPath: string }[] = [];

    for (const sub of showBackdrops) {
      if (sub.show.backdropPath) {
        images.push({ backdropPath: sub.show.backdropPath });
      }
    }

    for (const watch of movieBackdrops) {
      if (watch.movie.backdropPath) {
        images.push({ backdropPath: watch.movie.backdropPath });
      }
    }

    return images;
  }

  async adminListUsers(page: number, limit: number): Promise<{
    data: SafeUser[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count(),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async toggleUserActive(
    adminId: string,
    targetUserId: string,
  ): Promise<{ id: string; isActive: boolean }> {
    // Impede que o admin desative a própria conta
    if (adminId === targetUserId) {
      throw new BadRequestException(USERS_MESSAGES.CANNOT_DEACTIVATE_SELF);
    }

    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, isActive: true },
    });

    if (!target) {
      throw new NotFoundException(USERS_MESSAGES.USER_NOT_FOUND);
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { isActive: !target.isActive },
      select: { id: true, isActive: true },
    });

    // Ao desativar: revoga todos os refresh tokens ativos para encerrar sessões
    if (!updated.isActive) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: targetUserId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    return updated;
  }
}
