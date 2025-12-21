import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { MoodsService } from "./moods.service";
import { CreateMoodDto } from "./dto/create-mood.dto";
import { UpdateMoodDto } from "./dto/update-mood.dto";

@ApiTags("moods")
@Controller("v1/moods")
export class MoodsController {
  constructor(private readonly moodsService: MoodsService) {}

  @Get() findAll() { return this.moodsService.findAll(); }
  @Get(":id") findOne(@Param("id") id: string) { return this.moodsService.findOne(id); }
  @Post() create(@Body() dto: CreateMoodDto) { return this.moodsService.create(dto); }
  @Put(":id") update(@Param("id") id: string, @Body() dto: UpdateMoodDto) { return this.moodsService.update(id, dto); }
  @Delete(":id") remove(@Param("id") id: string) { return this.moodsService.remove(id); }
}
