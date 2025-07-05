import { IsNumber, IsString } from 'class-validator';

export class SendNotificationDto {
  @IsNumber()
  userId!: number;

  @IsNumber()
  articleId!: number;

  @IsString()
  message!: string;
}
