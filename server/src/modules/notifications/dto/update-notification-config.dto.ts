import { IsArray, IsNumber, IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateNotificationConfigDto {
  @IsNumber()
  userId!: number;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  enabledCategoryIds?: number[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @IsOptional()
  @IsBoolean()
  emailNotificationsEnabled?: boolean;
}
