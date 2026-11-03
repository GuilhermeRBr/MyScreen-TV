import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @HttpCode(HttpStatus.OK)
  @SkipThrottle() // Pings de keep-alive não devem consumir rate limit
  @ApiOperation({ summary: 'Verificação de saúde do servidor' })
  @ApiResponse({ status: 200, description: 'Servidor operacional.' })
  check(): { status: string } {
    return { status: 'ok' };
  }
}
