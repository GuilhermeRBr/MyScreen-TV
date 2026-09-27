import { IsUUID } from 'class-validator';

export class ToggleMovieDto {
  @IsUUID()
  movieId!: string;
}
