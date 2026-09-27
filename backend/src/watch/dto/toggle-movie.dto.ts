import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ToggleMovieDto {
  @ApiProperty({ description: 'ID interno do filme (UUID)', example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  movieId!: string;
}
