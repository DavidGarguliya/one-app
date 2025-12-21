import { Body, Controller, Get, Param, Post, Put, Query, Delete } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { TracksService } from "./tracks.service";
import { CreateTrackDto } from "./dto/create-track.dto";
import { UpdateTrackDto } from "./dto/update-track.dto";

@ApiTags("tracks")
@Controller("v1/tracks")
export class TracksController {
  constructor(private readonly tracksService: TracksService) {}

  @Get("featured")
  featured() {
    return this.tracksService.getFeatured();
  }

  @Get("latest")
  latest() {
    return this.tracksService.getLatest(8);
  }

  @Get()
  findAll(@Query("genre") genre?: string, @Query("occasion") occasion?: string) {
    return this.tracksService.findAll({ genre, occasion });
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.tracksService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateTrackDto) {
    return this.tracksService.create(dto);
  }

  @Post("bulk")
  createBulk(@Body() dtos: CreateTrackDto[]) {
    return this.tracksService.createMany(dtos);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdateTrackDto) {
    return this.tracksService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.tracksService.remove(id);
  }
}
