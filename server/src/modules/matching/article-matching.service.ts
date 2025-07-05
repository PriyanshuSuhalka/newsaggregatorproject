import { Injectable, Logger } from '@nestjs/common';
import { Article } from '@modules/articles/article.entity';
import { NotificationConfiguration } from '@modules/notificationconfig/notification-config.entity';

export interface MatchResult {
  matched: boolean;
  score: number;
  reasons: string[];
  matchedCategories: string[];
  matchedKeywords: string[];
}

export interface CategorySynonyms {
  [key: string]: string[];
}

export interface WordStems {
  [key: string]: string[];
}

@Injectable()
export class ArticleMatchingService {
  private readonly logger = new Logger(ArticleMatchingService.name);

  // Category synonyms and related terms
  private readonly categorySynonyms: CategorySynonyms = {
    'technology': ['tech', 'software', 'hardware', 'digital', 'computer', 'ai', 'artificial intelligence', 'ml', 'machine learning', 'programming', 'coding', 'development'],
    'sports': ['sport', 'football', 'basketball', 'soccer', 'tennis', 'baseball', 'hockey', 'athletics', 'championship', 'tournament', 'league', 'game'],
    'business': ['finance', 'economy', 'financial', 'market', 'stock', 'investment', 'corporate', 'company', 'startup', 'entrepreneur', 'commerce', 'trade'],
    'health': ['medical', 'medicine', 'healthcare', 'wellness', 'fitness', 'hospital', 'doctor', 'treatment', 'disease', 'therapy', 'pharmaceutical'],
    'science': ['research', 'study', 'discovery', 'experiment', 'scientific', 'biology', 'chemistry', 'physics', 'astronomy', 'space'],
    'entertainment': ['movie', 'film', 'music', 'celebrity', 'tv', 'television', 'show', 'actor', 'actress', 'concert', 'album', 'gaming'],
    'politics': ['government', 'election', 'political', 'policy', 'president', 'minister', 'parliament', 'congress', 'senate', 'vote', 'campaign'],
    'world': ['international', 'global', 'country', 'nation', 'foreign', 'diplomatic', 'war', 'conflict', 'peace', 'treaty'],
    'general': ['news', 'breaking', 'update', 'report', 'announcement', 'event', 'incident', 'story']
  };

  // Common word stems and variations
  private readonly commonStems: WordStems = {
    'technolog': ['technology', 'technologies', 'technological', 'tech'],
    'econom': ['economy', 'economic', 'economics', 'economist'],
    'polit': ['politics', 'political', 'politician', 'policy'],
    'health': ['health', 'healthy', 'healthcare'],
    'sport': ['sport', 'sports', 'sporting'],
    'business': ['business', 'businesses', 'commercial'],
    'scienc': ['science', 'scientific', 'scientist'],
    'entertain': ['entertainment', 'entertaining', 'entertainer']
  };

  /**
   * Main method to check if an article matches user configuration
   */
  async matchArticle(article: Article, config: NotificationConfiguration): Promise<MatchResult> {
    const result: MatchResult = {
      matched: false,
      score: 0,
      reasons: [],
      matchedCategories: [],
      matchedKeywords: []
    };

    // Check category matches
    const categoryMatch = this.checkCategoryMatch(article, config);
    this.mergeMatchResults(result, categoryMatch);

    // Check keyword matches
    const keywordMatch = this.checkKeywordMatch(article, config);
    this.mergeMatchResults(result, keywordMatch);

    // Apply bonus for multiple match types
    if (result.matchedCategories.length > 0 && result.matchedKeywords.length > 0) {
      result.score += 20;
      result.reasons.push('Multiple match types (category + keyword)');
    }

    this.logger.debug(`Article "${article.articleTitle}" match result: score=${result.score}, matched=${result.matched}`);

    return result;
  }

  /**
   * Batch match multiple articles against a configuration
   */
  async matchArticles(articles: Article[], config: NotificationConfiguration): Promise<{ article: Article; match: MatchResult }[]> {
    const results: { article: Article; match: MatchResult }[] = [];

    for (const article of articles) {
      const match = await this.matchArticle(article, config);
      results.push({ article, match });
    }

    // Sort by match score (highest first)
    return results.sort((a, b) => b.match.score - a.match.score);
  }

  /**
   * Check if article matches user's enabled categories
   */
  private checkCategoryMatch(article: Article, config: NotificationConfiguration): MatchResult {
    const result: MatchResult = {
      matched: false,
      score: 0,
      reasons: [],
      matchedCategories: [],
      matchedKeywords: []
    };

    if (!config.enabledCategoryIds || config.enabledCategoryIds.length === 0) {
      return result;
    }

    const articleCategoryId = article.category?.categoryID;
    const articleCategoryName = article.category?.categoryName?.toLowerCase();

    if (!articleCategoryId || !articleCategoryName) {
      return result;
    }

    // Direct category ID match
    if (config.enabledCategoryIds.includes(articleCategoryId)) {
      result.matched = true;
      result.score += 50; // High score for direct category match
      result.reasons.push(`Direct category match: ${article.category.categoryName}`);
      result.matchedCategories.push(article.category.categoryName);
      return result;
    }

    // Check for category synonyms in article title and content
    const titleLower = article.articleTitle.toLowerCase();
    const contentLower = article.articleContent.toLowerCase();

    for (const categoryId of config.enabledCategoryIds) {
      // Check against known category synonyms
      for (const [categoryKey, synonyms] of Object.entries(this.categorySynonyms)) {
        const categoryScore = this.checkTextForTerms(titleLower, contentLower, synonyms);
        if (categoryScore > 0) {
          result.matched = true;
          result.score += categoryScore;
          result.reasons.push(`Category synonym match for ${categoryKey}`);
          result.matchedCategories.push(categoryKey);
        }
      }
    }

    return result;
  }

  /**
   * Check if article matches user's keywords
   */
  private checkKeywordMatch(article: Article, config: NotificationConfiguration): MatchResult {
    const result: MatchResult = {
      matched: false,
      score: 0,
      reasons: [],
      matchedCategories: [],
      matchedKeywords: []
    };

    if (!config.keywords || config.keywords.length === 0) {
      return result;
    }

    const titleLower = article.articleTitle.toLowerCase();
    const contentLower = article.articleContent.toLowerCase();

    for (const keyword of config.keywords) {
      const keywordLower = keyword.toLowerCase().trim();
      if (!keywordLower) continue;

      const keywordScore = this.checkKeywordInText(titleLower, contentLower, keywordLower);
      if (keywordScore > 0) {
        result.matched = true;
        result.score += keywordScore;
        result.matchedKeywords.push(keyword);
      }
    }

    if (result.matchedKeywords.length > 0) {
      result.reasons.push(`Keyword matches: ${result.matchedKeywords.join(', ')}`);
    }

    return result;
  }

  /**
   * Check if a keyword appears in title or content with various matching strategies
   */
  private checkKeywordInText(title: string, content: string, keyword: string): number {
    let score = 0;

    // Exact match in title (highest priority)
    if (title.includes(keyword)) {
      score += 30;
    }

    // Exact match in content
    if (content.includes(keyword)) {
      score += 15;
    }

    // Word boundary match in title
    const titleWordBoundary = new RegExp(`\\b${this.escapeRegex(keyword)}\\b`, 'i');
    if (titleWordBoundary.test(title)) {
      score += 25;
    }

    // Word boundary match in content
    const contentWordBoundary = new RegExp(`\\b${this.escapeRegex(keyword)}\\b`, 'i');
    if (contentWordBoundary.test(content)) {
      score += 10;
    }

    // Fuzzy matching (variations, plurals, etc.)
    const variations = this.generateKeywordVariations(keyword);
    for (const variation of variations) {
      if (title.includes(variation)) {
        score += 20;
      }
      if (content.includes(variation)) {
        score += 8;
      }
    }

    // Stem matching
    const stem = this.extractStem(keyword);
    if (stem && stem !== keyword) {
      if (title.includes(stem)) {
        score += 15;
      }
      if (content.includes(stem)) {
        score += 5;
      }
    }

    return score;
  }

  /**
   * Check if any terms from a list appear in title or content
   */
  private checkTextForTerms(title: string, content: string, terms: string[]): number {
    let score = 0;

    for (const term of terms) {
      const termLower = term.toLowerCase();
      
      // Exact match in title
      if (title.includes(termLower)) {
        score += 20;
      }

      // Exact match in content
      if (content.includes(termLower)) {
        score += 10;
      }

      // Word boundary match
      const wordBoundary = new RegExp(`\\b${this.escapeRegex(termLower)}\\b`, 'i');
      if (wordBoundary.test(title)) {
        score += 15;
      }
      if (wordBoundary.test(content)) {
        score += 5;
      }
    }

    return score;
  }

  /**
   * Generate keyword variations (plurals, past tense, etc.)
   */
  private generateKeywordVariations(keyword: string): string[] {
    const variations: string[] = [];

    // Add plurals
    if (!keyword.endsWith('s')) {
      variations.push(keyword + 's');
    }
    if (keyword.endsWith('y')) {
      variations.push(keyword.slice(0, -1) + 'ies');
    }
    if (keyword.endsWith('s') && keyword.length > 1) {
      variations.push(keyword.slice(0, -1)); // singular
    }

    // Add past tense
    if (!keyword.endsWith('ed')) {
      variations.push(keyword + 'ed');
      if (keyword.endsWith('e')) {
        variations.push(keyword + 'd');
      }
    }

    // Add -ing form
    if (!keyword.endsWith('ing')) {
      variations.push(keyword + 'ing');
      if (keyword.endsWith('e')) {
        variations.push(keyword.slice(0, -1) + 'ing');
      }
    }

    return variations.filter(v => v !== keyword);
  }

  /**
   * Extract word stem for better matching
   */
  private extractStem(word: string): string | null {
    // Simple stemming - remove common suffixes
    const suffixes = ['ing', 'ed', 'er', 'est', 'ly', 'tion', 'sion', 'ness', 'ment'];
    
    for (const suffix of suffixes) {
      if (word.endsWith(suffix) && word.length > suffix.length + 2) {
        return word.slice(0, -suffix.length);
      }
    }

    // Check against known stems
    for (const [stem, words] of Object.entries(this.commonStems)) {
      if (words.includes(word)) {
        return stem;
      }
    }

    return null;
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Merge two match results
   */
  private mergeMatchResults(target: MatchResult, source: MatchResult): void {
    if (source.matched) {
      target.matched = true;
      target.score += source.score;
      target.reasons.push(...source.reasons);
      target.matchedCategories.push(...source.matchedCategories);
      target.matchedKeywords.push(...source.matchedKeywords);
    }
  }
}
