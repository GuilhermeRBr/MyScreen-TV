import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class AddListItemDto {
  @ApiPropertyOptional({ description: 'ID interno da série (UUID)', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  showId?: string;

  @ApiPropertyOptional({ description: 'ID interno do filme (UUID)', example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsOptional()
  @IsUUID()
  movieId?: string;
}
