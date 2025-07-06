import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArticleLike, LikeType } from './article-like.entity';
import { User } from '../users/user.entity';
import { Article } from '../articles/article.entity';

export interface LikeStatsDto {
  likesCount: number;
  dislikesCount: number;
  userVote?: LikeType | null;
}

@Injectable()
export class ArticleLikeService {
  constructor(
    @InjectRepository(ArticleLike)
    private articleLikeRepository: Repository<ArticleLike>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
  ) {}

  async likeArticle(userId: number, articleId: number): Promise<ArticleLike> {
    const user = await this.userRepository.findOne({ where: { userID: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const article = await this.articleRepository.findOne({ where: { articleID: articleId } });
    if (!article) {
      throw new NotFoundException('Article not found');
    }

    // Check if user already voted
    const existingVote = await this.articleLikeRepository.findOne({
      where: { user: { userID: userId }, article: { articleID: articleId } }
    });

    if (existingVote) {
      if (existingVote.likeType === LikeType.LIKE) {
        throw new BadRequestException('You have already liked this article');
      }
      // If user previously disliked, update to like
      existingVote.likeType = LikeType.LIKE;
      return await this.articleLikeRepository.save(existingVote);
    }

    // Create new like
    const newLike = this.articleLikeRepository.create({
      user,
      article,
      likeType: LikeType.LIKE
    });

    return await this.articleLikeRepository.save(newLike);
  }

  async dislikeArticle(userId: number, articleId: number): Promise<ArticleLike> {
    const user = await this.userRepository.findOne({ where: { userID: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const article = await this.articleRepository.findOne({ where: { articleID: articleId } });
    if (!article) {
      throw new NotFoundException('Article not found');
    }

    // Check if user already voted
    const existingVote = await this.articleLikeRepository.findOne({
      where: { user: { userID: userId }, article: { articleID: articleId } }
    });

    if (existingVote) {
      if (existingVote.likeType === LikeType.DISLIKE) {
        throw new BadRequestException('You have already disliked this article');
      }
      // If user previously liked, update to dislike
      existingVote.likeType = LikeType.DISLIKE;
      return await this.articleLikeRepository.save(existingVote);
    }

    // Create new dislike
    const newDislike = this.articleLikeRepository.create({
      user,
      article,
      likeType: LikeType.DISLIKE
    });

    return await this.articleLikeRepository.save(newDislike);
  }

  async removeVote(userId: number, articleId: number): Promise<void> {
    const existingVote = await this.articleLikeRepository.findOne({
      where: { user: { userID: userId }, article: { articleID: articleId } }
    });

    if (!existingVote) {
      throw new NotFoundException('No vote found for this article');
    }

    await this.articleLikeRepository.remove(existingVote);
  }

  async getArticleLikeStats(articleId: number, userId?: number): Promise<LikeStatsDto> {
    const likes = await this.articleLikeRepository.count({
      where: { article: { articleID: articleId }, likeType: LikeType.LIKE }
    });

    const dislikes = await this.articleLikeRepository.count({
      where: { article: { articleID: articleId }, likeType: LikeType.DISLIKE }
    });

    let userVote: LikeType | null = null;
    if (userId) {
      const vote = await this.articleLikeRepository.findOne({
        where: { user: { userID: userId }, article: { articleID: articleId } }
      });
      userVote = vote?.likeType || null;
    }

    return {
      likesCount: likes,
      dislikesCount: dislikes,
      userVote
    };
  }
}
