import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { PublishStatus, TagDTO } from "@one-app/types";

export class CreateTrackDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty()
  @IsString()
  artist!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  album?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiProperty()
  @IsString()
  audioUrl!: string;

  @ApiProperty()
  @IsString()
  coverUrl!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  style?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  mood?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  occasion?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  genre?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  story?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  clientRequest?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  creationStory?: string;

  @ApiProperty({ required: false, enum: ["embedded", "uploaded"] })
  @IsOptional()
  @IsString()
  coverSource?: "embedded" | "uploaded";

  @ApiProperty({ type: [Object], required: false })
  @IsOptional()
  @IsArray()
  tags?: TagDTO[];

  @ApiProperty({ enum: ["draft", "published"], required: false })
  @IsOptional()
  @IsEnum(["draft", "published"])
  status?: PublishStatus;
}
