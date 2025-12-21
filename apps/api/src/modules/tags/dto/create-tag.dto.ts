import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";
import { TagType } from "@one-app/types";

export class CreateTagDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  slug!: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty({ enum: ["genre", "mood", "occasion"] })
  @IsEnum(["genre", "mood", "occasion"])
  type!: TagType;
}
