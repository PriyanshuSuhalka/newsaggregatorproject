import { Controller, Post, Body } from '@nestjs/common';
import { CategoryService } from './category.service';
import { Category } from './category.entity';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  async createCategory(@Body() category: { categoryName: string }): Promise<Category> {
    return this.categoryService.create(category.categoryName);
  }
}
