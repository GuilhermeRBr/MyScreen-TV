import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class AddByTmdbDto {
  @ApiProperty({ description: 'ID do item no TMDB', example: 27205 })
  @IsInt()
  @Min(1)
  tmdbId!: number;
}
