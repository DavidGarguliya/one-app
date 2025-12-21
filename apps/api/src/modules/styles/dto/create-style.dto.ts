import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty } from "class-validator";

export class CreateStyleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;
}
