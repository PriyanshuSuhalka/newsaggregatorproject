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
}
