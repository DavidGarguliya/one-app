import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl } from "class-validator";
import { PublishStatus } from "@one-app/types";

export class CreatePlaylistDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  coverUrl?: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  trackIds!: string[];

  @ApiProperty({ enum: ["draft", "published"], required: false })
  @IsOptional()
  @IsEnum(["draft", "published"])
  status?: PublishStatus;
}
