import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { StylesService } from "./styles.service";
import { CreateStyleDto } from "./dto/create-style.dto";
import { UpdateStyleDto } from "./dto/update-style.dto";

@ApiTags("styles")
@Controller("v1/styles")
export class StylesController {
  constructor(private readonly stylesService: StylesService) {}

  @Get()
  findAll() {
    return this.stylesService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.stylesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateStyleDto) {
    return this.stylesService.create(dto);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdateStyleDto) {
    return this.stylesService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.stylesService.remove(id);
  }
}
