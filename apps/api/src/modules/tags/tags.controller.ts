import { Body, Controller, Get, Param, Post, Put, Delete } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { TagsService } from "./tags.service";
import { CreateTagDto } from "./dto/create-tag.dto";
import { UpdateTagDto } from "./dto/update-tag.dto";

@ApiTags("tags")
@Controller("v1/tags")
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  findAll() {
    return this.tagsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.tagsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateTagDto) {
    return this.tagsService.create(dto);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdateTagDto) {
    return this.tagsService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.tagsService.remove(id);
  }
}
