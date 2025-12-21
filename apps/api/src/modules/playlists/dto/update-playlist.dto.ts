import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsEnum, IsOptional, IsString, IsUrl } from "class-validator";
import { PublishStatus } from "@one-app/types";

export class UpdatePlaylistDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: "Ссылка на обложку. Пустая строка сбрасывает обложку" })
  @IsOptional()
  @IsString()
  coverUrl?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  trackIds?: string[];

  @ApiPropertyOptional({ enum: ["draft", "published"] })
  @IsOptional()
  @IsEnum(["draft", "published"])
  status?: PublishStatus;
}
