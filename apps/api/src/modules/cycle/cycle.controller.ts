import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UUID } from 'crypto';
import { AuthenticatedRequest } from '../auth/types/AuthenticatedRequest';
import { CycleService } from './cycle.service';
import { CreateCycleRequestDto } from './dto/create-cycle.dto';
import { UpdateCycleRequestDto } from './dto/update-cycle.dto';

@ApiBearerAuth()
@ApiTags('cycle')
@Controller('cycle')
export class CycleController {
  constructor(private readonly cycleService: CycleService) {}

  @Get('getAll')
  async findAll(@Req() req: AuthenticatedRequest) {
    return this.cycleService.findAllByUser(req.user.uuid);
  }

  @Post('add')
  async create(
    @Body() createCycleDto: CreateCycleRequestDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.cycleService.create(createCycleDto, req.user.uuid);
  }

  @Get('get/:cycleUuid')
  async findOne(
    @Param('cycleUuid', ParseUUIDPipe) cycleUuid: UUID,
    @Req() req: AuthenticatedRequest
  ) {
    return this.cycleService.findOneById(cycleUuid, req.user.uuid);
  }

  @Put('update/:cycleUuid')
  async update(
    @Param('cycleUuid', ParseUUIDPipe) cycleUuid: UUID,
    @Body() updateCycleDto: UpdateCycleRequestDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.cycleService.update(cycleUuid, updateCycleDto, req.user.uuid);
  }

  @Delete('delete/:cycleUuid')
  async remove(
    @Param('cycleUuid', ParseUUIDPipe) cycleUuid: UUID,
    @Req() req: AuthenticatedRequest
  ) {
    return this.cycleService.removeCycle(cycleUuid, req.user.uuid);
  }
}
