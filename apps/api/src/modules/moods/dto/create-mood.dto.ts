import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty } from "class-validator";

export class CreateMoodDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;
}
