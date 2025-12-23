import { IsString, IsOptional, IsMongoId } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsMongoId()
  parentComment?: string;
}