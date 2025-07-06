import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlockedKeyword } from './blocked-keyword.entity';
import { User } from '../users/user.entity';

@Injectable()
export class BlockedKeywordService {
  constructor(
    @InjectRepository(BlockedKeyword)
    private blockedKeywordRepository: Repository<BlockedKeyword>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async addKeyword(keyword: string, adminId: number): Promise<BlockedKeyword> {
    const admin = await this.userRepository.findOne({ where: { userID: adminId } });
    
    if (!admin || admin.role !== 'admin') {
      throw new Error('Only admins can add blocked keywords');
    }

    // Check if keyword already exists
    const existing = await this.blockedKeywordRepository.findOne({
      where: { keyword: keyword.toLowerCase() }
    });

    if (existing) {
      throw new Error('Keyword already blocked');
    }

    const blockedKeyword = this.blockedKeywordRepository.create({
      keyword: keyword.toLowerCase(),
      addedBy: admin,
    });

    return this.blockedKeywordRepository.save(blockedKeyword);
  }

  async removeKeyword(keywordId: number): Promise<void> {
    await this.blockedKeywordRepository.delete(keywordId);
  }

  async getAllKeywords(): Promise<BlockedKeyword[]> {
    return this.blockedKeywordRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' }
    });
  }

  async checkContentForBlockedKeywords(content: string): Promise<boolean> {
    const keywords = await this.getAllKeywords();
    const lowerContent = content.toLowerCase();
    
    return keywords.some(kw => lowerContent.includes(kw.keyword));
  }
}
