import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './category.entity';
import { CategoryService } from './category.service';
import { CategoryController, AdminCategoryController } from './category.controller';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Category, User])],
  providers: [CategoryService],
  controllers: [CategoryController, AdminCategoryController],
  exports: [CategoryService, TypeOrmModule],
})
export class CategoryModule {}
