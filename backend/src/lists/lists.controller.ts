import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ListsService } from './lists.service';
import { CreateListDto } from './dto/create-list.dto';
import { AddListItemDto } from './dto/add-list-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('lists')
@UseGuards(JwtAuthGuard)
export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateListDto) {
    return this.listsService.createList(user.sub, dto);
  }

  @Get()
  getMyLists(@CurrentUser() user: JwtPayload) {
    return this.listsService.getUserLists(user.sub);
  }

  @Get(':listId')
  getById(
    @CurrentUser() user: JwtPayload,
    @Param('listId', ParseUUIDPipe) listId: string,
  ) {
    return this.listsService.getListById(listId, user.sub);
  }

  @Post(':listId/items')
  addItem(
    @CurrentUser() user: JwtPayload,
    @Param('listId', ParseUUIDPipe) listId: string,
    @Body() dto: AddListItemDto,
  ) {
    return this.listsService.addItem(user.sub, listId, dto);
  }

  @Delete(':listId/items/:itemId')
  removeItem(
    @CurrentUser() user: JwtPayload,
    @Param('listId', ParseUUIDPipe) listId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.listsService.removeItem(user.sub, listId, itemId);
  }

  @Delete(':listId')
  deleteList(
    @CurrentUser() user: JwtPayload,
    @Param('listId', ParseUUIDPipe) listId: string,
  ) {
    return this.listsService.deleteList(user.sub, listId);
  }
}
