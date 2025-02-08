import { CycleDto, UpdateCycleDto } from '@basal-temp-log-workspace/model';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UUID } from 'crypto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { AuthenticatedRequest } from '../auth/types/AuthenticatedRequest';
import { CycleService } from './cycle.service';

@Controller('cycle')
export class CycleController {
  constructor(private readonly cycleService: CycleService) {}

  @UseGuards(JwtGuard)
  @Post('add')
  async create(
    @Body() createCycleDto: CycleDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.cycleService.create(createCycleDto, req.user.uuid);
  }

  @UseGuards(JwtGuard)
  @Get('get/:cycleId')
  async findOne(
    @Param('cycleId') cycleUuid: UUID,
    @Req() req: AuthenticatedRequest
  ) {
    return this.cycleService.findOneById(cycleUuid, req.user.uuid);
  }

  @UseGuards(JwtGuard)
  @Put('update/:cycleId')
  async update(
    @Param('cycleId') cycleUuid: UUID,
    @Body() updateCycleDto: UpdateCycleDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.cycleService.update(cycleUuid, updateCycleDto, req.user.uuid);
  }

  @UseGuards(JwtGuard)
  @Delete('delete/:cycleId')
  async remove(
    @Param('cycleId') cycleUuid: UUID,
    @Req() req: AuthenticatedRequest
  ) {
    return this.cycleService.removeCycle(cycleUuid, req.user.uuid);
  }
}
