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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ListsService } from './lists.service';
import { CreateListDto } from './dto/create-list.dto';
import { AddListItemDto } from './dto/add-list-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { LISTS_SWAGGER } from './messages/lists.swagger';

@ApiTags('Lists')
@ApiCookieAuth('access_token')
@Controller('lists')
@UseGuards(JwtAuthGuard)
export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  @Post()
  @ApiOperation(LISTS_SWAGGER.create.operation)
  @ApiResponse({ status: 201, description: LISTS_SWAGGER.create.responses[201] })
  @ApiResponse({ status: 401, description: LISTS_SWAGGER.create.responses[401] })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateListDto) {
    return this.listsService.createList(user.sub, dto);
  }

  @Get()
  @ApiOperation(LISTS_SWAGGER.getMyLists.operation)
  @ApiResponse({ status: 200, description: LISTS_SWAGGER.getMyLists.responses[200] })
  @ApiResponse({ status: 401, description: LISTS_SWAGGER.getMyLists.responses[401] })
  getMyLists(@CurrentUser() user: JwtPayload) {
    return this.listsService.getUserLists(user.sub);
  }

  @Get(':listId')
  @ApiOperation(LISTS_SWAGGER.getById.operation)
  @ApiParam({ name: 'listId', description: 'UUID da lista', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: LISTS_SWAGGER.getById.responses[200] })
  @ApiResponse({ status: 403, description: LISTS_SWAGGER.getById.responses[403] })
  @ApiResponse({ status: 404, description: LISTS_SWAGGER.getById.responses[404] })
  getById(
    @CurrentUser() user: JwtPayload,
    @Param('listId', ParseUUIDPipe) listId: string,
  ) {
    return this.listsService.getListById(listId, user.sub);
  }

  @Post(':listId/items')
  @ApiOperation(LISTS_SWAGGER.addItem.operation)
  @ApiParam({ name: 'listId', description: 'UUID da lista', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 201, description: LISTS_SWAGGER.addItem.responses[201] })
  @ApiResponse({ status: 400, description: LISTS_SWAGGER.addItem.responses[400] })
  @ApiResponse({ status: 403, description: LISTS_SWAGGER.addItem.responses[403] })
  @ApiResponse({ status: 404, description: LISTS_SWAGGER.addItem.responses[404] })
  addItem(
    @CurrentUser() user: JwtPayload,
    @Param('listId', ParseUUIDPipe) listId: string,
    @Body() dto: AddListItemDto,
  ) {
    return this.listsService.addItem(user.sub, listId, dto);
  }

  @Delete(':listId/items/:itemId')
  @ApiOperation(LISTS_SWAGGER.removeItem.operation)
  @ApiParam({ name: 'listId', description: 'UUID da lista' })
  @ApiParam({ name: 'itemId', description: 'UUID do item' })
  @ApiResponse({ status: 200, description: LISTS_SWAGGER.removeItem.responses[200] })
  @ApiResponse({ status: 403, description: LISTS_SWAGGER.removeItem.responses[403] })
  @ApiResponse({ status: 404, description: LISTS_SWAGGER.removeItem.responses[404] })
  removeItem(
    @CurrentUser() user: JwtPayload,
    @Param('listId', ParseUUIDPipe) listId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.listsService.removeItem(user.sub, listId, itemId);
  }

  @Delete(':listId')
  @ApiOperation(LISTS_SWAGGER.deleteList.operation)
  @ApiParam({ name: 'listId', description: 'UUID da lista' })
  @ApiResponse({ status: 200, description: LISTS_SWAGGER.deleteList.responses[200] })
  @ApiResponse({ status: 403, description: LISTS_SWAGGER.deleteList.responses[403] })
  @ApiResponse({ status: 404, description: LISTS_SWAGGER.deleteList.responses[404] })
  deleteList(
    @CurrentUser() user: JwtPayload,
    @Param('listId', ParseUUIDPipe) listId: string,
  ) {
    return this.listsService.deleteList(user.sub, listId);
  }
}
