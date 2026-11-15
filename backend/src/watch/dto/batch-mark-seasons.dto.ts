import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID, ArrayNotEmpty } from 'class-validator';

export class BatchMarkSeasonsDto {
  @ApiProperty({
    description: 'Lista de UUIDs internos das temporadas a marcar como assistidas.',
    type: [String],
    example: ['uuid-1', 'uuid-2'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  seasonIds!: string[];
}
