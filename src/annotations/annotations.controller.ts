import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { UpdateAnnotationDto } from './dto/update-annotation.dto';
import { AnnotationDto } from './dto/annotation.dto';
import { AnnotationResponseDto } from './dto/annotation-response.dto';
import { AnnotationsService } from './annotations.service';

@Controller()
export class AnnotationsController {
  constructor(private readonly annotationsService: AnnotationsService) {}

  @Post('matches/:matchId/annotations')
  create(
    @Param('matchId', ParseIntPipe) matchId: number,
    @Body() dto: AnnotationDto,
  ): Promise<AnnotationResponseDto> {
    return this.annotationsService.create(matchId, dto);
  }

  @Get('matches/:matchId/annotations')
  findByMatch(
    @Param('matchId', ParseIntPipe) matchId: number,
  ): Promise<AnnotationResponseDto[]> {
    return this.annotationsService.findByMatch(matchId);
  }

  @Patch('annotations/:annotationId')
  update(
    @Param('annotationId', ParseIntPipe) annotationId: number,
    @Body() dto: UpdateAnnotationDto,
  ): Promise<AnnotationResponseDto> {
    return this.annotationsService.update(annotationId, dto);
  }

  @Delete('annotations/:annotationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  voidAnnotation(
    @Param('annotationId', ParseIntPipe) annotationId: number,
  ): Promise<void> {
    return this.annotationsService.voidAnnotation(annotationId);
  }
}
