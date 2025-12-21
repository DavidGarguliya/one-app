import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { OccasionsService } from "./occasions.service";
import { CreateOccasionDto } from "./dto/create-occasion.dto";
import { UpdateOccasionDto } from "./dto/update-occasion.dto";

@ApiTags("occasions")
@Controller("v1/occasions")
export class OccasionsController {
  constructor(private readonly occasionsService: OccasionsService) {}

  @Get() findAll() { return this.occasionsService.findAll(); }
  @Get(":id") findOne(@Param("id") id: string) { return this.occasionsService.findOne(id); }
  @Post() create(@Body() dto: CreateOccasionDto) { return this.occasionsService.create(dto); }
  @Put(":id") update(@Param("id") id: string, @Body() dto: UpdateOccasionDto) { return this.occasionsService.update(id, dto); }
  @Delete(":id") remove(@Param("id") id: string) { return this.occasionsService.remove(id); }
}
