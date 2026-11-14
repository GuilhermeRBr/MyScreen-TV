import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID, ArrayNotEmpty } from 'class-validator';

export class BatchMarkEpisodesDto {
  @ApiProperty({
    description: 'Lista de UUIDs internos dos episódios a marcar como assistidos.',
    type: [String],
    example: ['uuid-1', 'uuid-2'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  episodeIds!: string[];
}
