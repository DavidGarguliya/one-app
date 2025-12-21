import { PartialType } from "@nestjs/swagger";
import { CreateOccasionDto } from "./create-occasion.dto";
export class UpdateOccasionDto extends PartialType(CreateOccasionDto) {}
