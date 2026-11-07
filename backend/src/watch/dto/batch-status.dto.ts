import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, Min, ValidateNested } from 'class-validator';

export class BatchStatusItemDto {
  @ApiProperty({ example: 27205 })
  @IsInt()
  @Min(1)
  tmdbId!: number;

  @ApiProperty({ enum: ['movie', 'show'] })
  @IsEnum(['movie', 'show'])
  type!: 'movie' | 'show';
}

export class BatchStatusDto {
  @ApiProperty({ type: [BatchStatusItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchStatusItemDto)
  items!: BatchStatusItemDto[];
}
