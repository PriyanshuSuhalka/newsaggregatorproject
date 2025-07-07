import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>
  ) {}

  async create(name: string): Promise<Category> {
    const category = this.categoryRepo.create({ categoryName: name });
    return this.categoryRepo.save(category);
  }

  async hideCategory(categoryId: number, adminId: number): Promise<void> {
    // Import User repository when needed
    await this.categoryRepo.update(categoryId, {
      isHidden: true,
      hiddenAt: new Date(),
    });
  }

  async unhideCategory(categoryId: number, adminId: number): Promise<void> {
    await this.categoryRepo.update(categoryId, {
      isHidden: false,
      hiddenBy: undefined,
      hiddenAt: undefined,
    });
  }

  async getAllCategoriesWithStatus(): Promise<Category[]> {
    return this.categoryRepo.find({
      order: { categoryName: 'ASC' }
    });
  }

  async getVisibleCategories(): Promise<Category[]> {
    return this.categoryRepo.find({
      where: { isHidden: false },
      order: { categoryName: 'ASC' }
    });
  }
}
