import { Controller, Post, Body, Param, Get } from '@nestjs/common';
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

@Controller('admin/categories')
export class AdminCategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post(':id/hide')
  async hideCategory(
    @Param('id') categoryId: number,
    @Body('adminId') adminId: number,
  ) {
    try {
      await this.categoryService.hideCategory(categoryId, adminId);
      return { success: true, message: 'Category hidden successfully' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  @Post(':id/unhide')
  async unhideCategory(
    @Param('id') categoryId: number,
    @Body('adminId') adminId: number,
  ) {
    try {
      await this.categoryService.unhideCategory(categoryId, adminId);
      return { success: true, message: 'Category unhidden successfully' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  @Get()
  async getAllCategories() {
    return this.categoryService.getAllCategoriesWithStatus();
  }
}
