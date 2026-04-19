import { LyricsProvider } from "@one-app/types";
import { IsBoolean, IsIn, IsOptional, IsString } from "class-validator";

export class GenerateLyricsDto {
  @IsOptional()
  @IsIn(["deepgram", "assemblyai", "whisper"])
  provider?: LyricsProvider;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsBoolean()
  separateVocals?: boolean;

  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
