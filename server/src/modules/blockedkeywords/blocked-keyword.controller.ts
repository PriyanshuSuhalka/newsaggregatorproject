import { Controller, Post, Delete, Get, Param, Body } from '@nestjs/common';
import { BlockedKeywordService } from './blocked-keyword.service';

@Controller('admin/blocked-keywords')
export class BlockedKeywordController {
  constructor(private readonly blockedKeywordService: BlockedKeywordService) {}

  @Post()
  async addKeyword(
    @Body('keyword') keyword: string,
    @Body('adminId') adminId: number,
  ) {
    try {
      const blockedKeyword = await this.blockedKeywordService.addKeyword(keyword, adminId);
      return { success: true, message: 'Keyword blocked successfully' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  @Delete(':id')
  async removeKeyword(@Param('id') keywordId: number) {
    try {
      await this.blockedKeywordService.removeKeyword(keywordId);
      return { success: true, message: 'Keyword removed successfully' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  @Get()
  async getAllKeywords() {
    return this.blockedKeywordService.getAllKeywords();
  }
}
