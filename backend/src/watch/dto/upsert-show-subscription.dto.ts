import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';
import { ShowSubscriptionStatus } from '@prisma/client';

export class UpsertShowSubscriptionDto {
  @ApiProperty({ description: 'ID interno da série (UUID)', example: '550e8400-e29b-41d4-a716-446655440002' })
  @IsUUID()
  showId!: string;

  @ApiProperty({
    description: 'Status da assinatura',
    enum: ShowSubscriptionStatus,
    example: ShowSubscriptionStatus.WATCHING,
  })
  @IsEnum(ShowSubscriptionStatus)
  status!: ShowSubscriptionStatus;
}
