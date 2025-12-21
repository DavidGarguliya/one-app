import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty } from "class-validator";
export class CreateOccasionDto { @ApiProperty() @IsString() @IsNotEmpty() name!: string; }
