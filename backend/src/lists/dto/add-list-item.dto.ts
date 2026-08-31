import { IsOptional, IsUUID } from 'class-validator';

export class AddListItemDto {
  @IsOptional()
  @IsUUID()
  showId?: string;

  @IsOptional()
  @IsUUID()
  movieId?: string;
}
