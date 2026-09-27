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

@ApiTags('Lists')
@ApiCookieAuth('access_token')
@Controller('lists')
@UseGuards(JwtAuthGuard)
export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar lista', description: 'Cria uma nova lista personalizada para o usuário.' })
  @ApiResponse({ status: 201, description: 'Lista criada.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateListDto) {
    return this.listsService.createList(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Minhas listas', description: 'Retorna todas as listas do usuário autenticado.' })
  @ApiResponse({ status: 200, description: 'Lista de listas.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  getMyLists(@CurrentUser() user: JwtPayload) {
    return this.listsService.getUserLists(user.sub);
  }

  @Get(':listId')
  @ApiOperation({ summary: 'Detalhes de uma lista', description: 'Retorna os itens de uma lista específica. O usuário precisa ser o dono ou a lista deve ser pública.' })
  @ApiParam({ name: 'listId', description: 'UUID da lista', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: 'Lista com seus itens.' })
  @ApiResponse({ status: 403, description: 'Sem permissão para ver esta lista.' })
  @ApiResponse({ status: 404, description: 'Lista não encontrada.' })
  getById(
    @CurrentUser() user: JwtPayload,
    @Param('listId', ParseUUIDPipe) listId: string,
  ) {
    return this.listsService.getListById(listId, user.sub);
  }

  @Post(':listId/items')
  @ApiOperation({ summary: 'Adicionar item à lista', description: 'Adiciona uma série ou filme a uma lista. Forneça showId ou movieId.' })
  @ApiParam({ name: 'listId', description: 'UUID da lista', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 201, description: 'Item adicionado.' })
  @ApiResponse({ status: 400, description: 'Nenhum showId ou movieId fornecido.' })
  @ApiResponse({ status: 403, description: 'Sem permissão.' })
  @ApiResponse({ status: 404, description: 'Lista não encontrada.' })
  addItem(
    @CurrentUser() user: JwtPayload,
    @Param('listId', ParseUUIDPipe) listId: string,
    @Body() dto: AddListItemDto,
  ) {
    return this.listsService.addItem(user.sub, listId, dto);
  }

  @Delete(':listId/items/:itemId')
  @ApiOperation({ summary: 'Remover item da lista' })
  @ApiParam({ name: 'listId', description: 'UUID da lista' })
  @ApiParam({ name: 'itemId', description: 'UUID do item' })
  @ApiResponse({ status: 200, description: 'Item removido.' })
  @ApiResponse({ status: 403, description: 'Sem permissão.' })
  @ApiResponse({ status: 404, description: 'Lista ou item não encontrado.' })
  removeItem(
    @CurrentUser() user: JwtPayload,
    @Param('listId', ParseUUIDPipe) listId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.listsService.removeItem(user.sub, listId, itemId);
  }

  @Delete(':listId')
  @ApiOperation({ summary: 'Excluir lista' })
  @ApiParam({ name: 'listId', description: 'UUID da lista' })
  @ApiResponse({ status: 200, description: 'Lista excluída.' })
  @ApiResponse({ status: 403, description: 'Sem permissão.' })
  @ApiResponse({ status: 404, description: 'Lista não encontrada.' })
  deleteList(
    @CurrentUser() user: JwtPayload,
    @Param('listId', ParseUUIDPipe) listId: string,
  ) {
    return this.listsService.deleteList(user.sub, listId);
  }
}
