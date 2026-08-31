import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateListDto } from './dto/create-list.dto';
import { AddListItemDto } from './dto/add-list-item.dto';

@Injectable()
export class ListsService {
  constructor(private readonly prisma: PrismaService) {}

  async createList(userId: string, dto: CreateListDto) {
    return this.prisma.customList.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
        isPublic: dto.isPublic ?? true,
      },
    });
  }

  async getUserLists(userId: string) {
    return this.prisma.customList.findMany({
      where: { userId },
      include: { _count: { select: { items: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getListById(listId: string, requestingUserId: string) {
    const list = await this.prisma.customList.findUnique({
      where: { id: listId },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!list) {
      throw new NotFoundException('Lista não encontrada');
    }

    if (!list.isPublic && list.userId !== requestingUserId) {
      throw new ForbiddenException('Acesso negado a esta lista');
    }

    return list;
  }

  async addItem(
    userId: string,
    listId: string,
    dto: AddListItemDto,
  ) {
    if (!dto.showId && !dto.movieId) {
      throw new BadRequestException('Informe showId ou movieId');
    }

    const list = await this.prisma.customList.findUnique({
      where: { id: listId },
      select: { userId: true },
    });

    if (!list) {
      throw new NotFoundException('Lista não encontrada');
    }

    if (list.userId !== userId) {
      throw new ForbiddenException('Acesso negado');
    }

    const lastItem = await this.prisma.customListItem.findFirst({
      where: { listId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    return this.prisma.customListItem.create({
      data: {
        listId,
        showId: dto.showId,
        movieId: dto.movieId,
        order: (lastItem?.order ?? -1) + 1,
      },
    });
  }

  async removeItem(userId: string, listId: string, itemId: string) {
    const list = await this.prisma.customList.findUnique({
      where: { id: listId },
      select: { userId: true },
    });

    if (!list) {
      throw new NotFoundException('Lista não encontrada');
    }

    if (list.userId !== userId) {
      throw new ForbiddenException('Acesso negado');
    }

    await this.prisma.customListItem.delete({ where: { id: itemId } });
  }

  async deleteList(userId: string, listId: string) {
    const list = await this.prisma.customList.findUnique({
      where: { id: listId },
      select: { userId: true },
    });

    if (!list) {
      throw new NotFoundException('Lista não encontrada');
    }

    if (list.userId !== userId) {
      throw new ForbiddenException('Acesso negado');
    }

    await this.prisma.customList.delete({ where: { id: listId } });
  }
}
