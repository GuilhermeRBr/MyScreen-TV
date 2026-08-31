import { IsUUID } from 'class-validator';

export class ToggleEpisodeDto {
  @IsUUID()
  episodeId: string;
}
