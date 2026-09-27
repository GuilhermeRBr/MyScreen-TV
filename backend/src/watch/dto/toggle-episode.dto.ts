import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ToggleEpisodeDto {
  @ApiProperty({ description: 'ID interno do episódio (UUID)', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  episodeId!: string;
}
