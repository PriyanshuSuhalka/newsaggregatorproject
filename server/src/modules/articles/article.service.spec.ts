import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArticleService, SearchOptions } from './article.service';
import { Article } from './article.entity';
import { Category } from '@modules/categories/category.entity';
import { ExternalAPI } from '@modules/externalapi/external-api.entity';
import { User } from '@modules/users/user.entity';
import { PersonalizationService } from '../personalization/personalization.service';
import { CreateArticleDto } from './dto/create-article.dto';

describe('ArticleService', () => {
  let service: ArticleService;
  let articleRepo: Repository<Article>;
  let categoryRepo: Repository<Category>;
  let externalRepo: Repository<ExternalAPI>;
  let userRepo: Repository<User>;
  let personalizationService: PersonalizationService;

  const mockCategory = {
    categoryID: 1,
    categoryName: 'Technology'
  } as Category;

  const mockExternalAPI = {
    externalAPIID: 1,
    name: 'NewsAPI',
    APIURL: 'https://newsapi.org',
    key: 'test-api-key',
    APIStatus: 1,
    lastAccessed: new Date()
  } as ExternalAPI;

  const mockArticle = {
    articleID: 1,
    articleTitle: 'AI Technology Breakthrough',
    articleContent: 'New artificial intelligence breakthrough in machine learning technology.',
    source: 'TechNews',
    URL: 'https://example.com/ai-news',
    publishDate: new Date('2025-07-05'),
    category: mockCategory,
    externalAPI: mockExternalAPI
  } as Article;

  const mockCreateArticleDto: CreateArticleDto = {
    articleTitle: 'New Tech Article',
    articleContent: 'Content about new technology',
    source: 'TechSource',
    URL: 'https://example.com/new-tech',
    publishDate: new Date('2025-07-05'),
    categoryId: 1,
    externalAPIId: 1
  };

  const mockArticleRepo = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockCategoryRepo = {
    findOneBy: jest.fn(),
  };

  const mockExternalRepo = {
    findOneBy: jest.fn(),
  };

  const mockUserRepo = {
    findOneBy: jest.fn(),
    find: jest.fn(),
  };

  const mockPersonalizationService = {
    calculatePersonalizationScore: jest.fn(),
  };

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleService,
        {
          provide: getRepositoryToken(Article),
          useValue: mockArticleRepo,
        },
        {
          provide: getRepositoryToken(Category),
          useValue: mockCategoryRepo,
        },
        {
          provide: getRepositoryToken(ExternalAPI),
          useValue: mockExternalRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: PersonalizationService,
          useValue: mockPersonalizationService,
        },
      ],
    }).compile();

    service = module.get<ArticleService>(ArticleService);
    articleRepo = module.get<Repository<Article>>(getRepositoryToken(Article));
    categoryRepo = module.get<Repository<Category>>(getRepositoryToken(Category));
    externalRepo = module.get<Repository<ExternalAPI>>(getRepositoryToken(ExternalAPI));
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    personalizationService = module.get<PersonalizationService>(PersonalizationService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockArticleRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all articles', async () => {
      const expectedArticles = [mockArticle];
      const mockUser = { userID: 1, name: 'Test User', email: 'test@example.com' } as User;
      
      mockArticleRepo.find.mockResolvedValue(expectedArticles);
      mockPersonalizationService.calculatePersonalizationScore.mockResolvedValue(75);

      const result = await service.findAll(mockUser);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        ...mockArticle,
        personalizationScore: 75
      });
      expect(mockArticleRepo.find).toHaveBeenCalledWith({
        where: { 
          isHidden: false,
          category: { isHidden: false }
        }
      });
      expect(mockPersonalizationService.calculatePersonalizationScore).toHaveBeenCalledWith(mockArticle, mockUser);
    });
  });

  describe('create', () => {
    it('should create a new article successfully', async () => {
      mockCategoryRepo.findOneBy.mockResolvedValue(mockCategory);
      mockExternalRepo.findOneBy.mockResolvedValue(mockExternalAPI);
      mockArticleRepo.save.mockResolvedValue(mockArticle);

      const result = await service.create(mockCreateArticleDto);

      expect(result).toEqual(mockArticle);
      expect(mockCategoryRepo.findOneBy).toHaveBeenCalledWith({ categoryID: 1 });
      expect(mockExternalRepo.findOneBy).toHaveBeenCalledWith({ externalAPIID: 1 });
      expect(mockArticleRepo.save).toHaveBeenCalled();
    });

    it('should throw error when category not found', async () => {
      mockCategoryRepo.findOneBy.mockResolvedValue(null);

      await expect(service.create(mockCreateArticleDto)).rejects.toThrow('Category not found');
    });

    it('should throw error when external API not found', async () => {
      mockCategoryRepo.findOneBy.mockResolvedValue(mockCategory);
      mockExternalRepo.findOneBy.mockResolvedValue(null);

      await expect(service.create(mockCreateArticleDto)).rejects.toThrow('External API not found');
    });
  });

  describe('getArticles', () => {
    it('should get articles with date range and category filter', async () => {
      const expectedArticles = [mockArticle];
      mockQueryBuilder.getMany.mockResolvedValue(expectedArticles);

      const result = await service.getArticles('2025-07-01', '2025-07-05', 'Technology');

      expect(result).toEqual(expectedArticles);
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('article.category', 'category');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'article.publishDate BETWEEN :start AND :end',
        { start: '2025-07-01', end: '2025-07-05' }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'LOWER(category.categoryName) = LOWER(:category)',
        { category: 'Technology' }
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('article.publishDate', 'DESC');
    });

    it('should get articles without filters', async () => {
      const expectedArticles = [mockArticle];
      mockQueryBuilder.getMany.mockResolvedValue(expectedArticles);

      const result = await service.getArticles();

      expect(result).toEqual(expectedArticles);
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
    });

    it('should skip category filter when category is "All"', async () => {
      const expectedArticles = [mockArticle];
      mockQueryBuilder.getMany.mockResolvedValue(expectedArticles);

      const result = await service.getArticles('2025-07-01', '2025-07-05', 'All');

      expect(result).toEqual(expectedArticles);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'article.publishDate BETWEEN :start AND :end',
        { start: '2025-07-01', end: '2025-07-05' }
      );
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith(
        'LOWER(category.categoryName) = LOWER(:category)',
        expect.any(Object)
      );
    });
  });

  describe('searchArticles', () => {
    const searchOptions: SearchOptions = {
      keyword: 'AI technology',
      start: '2025-07-01',
      end: '2025-07-05'
    };

    it('should search articles with keyword and date range', async () => {
      const expectedArticles = [mockArticle];
      mockQueryBuilder.getMany.mockResolvedValue(expectedArticles);

      const result = await service.searchArticles(searchOptions);

      expect(result).toEqual(expectedArticles);
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('article.category', 'category');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('article.externalAPI', 'externalAPI');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(LOWER(article.articleTitle) LIKE LOWER(:keyword) OR LOWER(article.articleContent) LIKE LOWER(:keyword))',
        { keyword: '%AI technology%' }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'article.publishDate BETWEEN :start AND :end',
        { start: new Date('2025-07-01'), end: new Date('2025-07-05') }
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('article.publishDate', 'DESC');
    });

    it('should search articles with keyword only', async () => {
      const searchOptionsKeywordOnly: SearchOptions = {
        keyword: 'technology'
      };
      const expectedArticles = [mockArticle];
      mockQueryBuilder.getMany.mockResolvedValue(expectedArticles);

      const result = await service.searchArticles(searchOptionsKeywordOnly);

      expect(result).toEqual(expectedArticles);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(LOWER(article.articleTitle) LIKE LOWER(:keyword) OR LOWER(article.articleContent) LIKE LOWER(:keyword))',
        { keyword: '%technology%' }
      );
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith(
        'article.publishDate BETWEEN :start AND :end',
        expect.any(Object)
      );
    });
  });

  describe('getSearchSuggestions', () => {
    it('should return search suggestions for valid input', async () => {
      const mockResults = [
        { article_articleTitle: 'AI Technology News' },
        { article_articleTitle: 'Machine Learning Technology' }
      ];
      mockQueryBuilder.getRawMany.mockResolvedValue(mockResults);

      const result = await service.getSearchSuggestions('tech');

      expect(result).toEqual(['AI Technology News', 'Machine Learning Technology']);
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('DISTINCT article.articleTitle');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'LOWER(article.articleTitle) LIKE LOWER(:keyword)',
        { keyword: '%tech%' }
      );
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(10);
    });

    it('should return empty array for short input', async () => {
      const result = await service.getSearchSuggestions('a');

      expect(result).toEqual([]);
      expect(mockQueryBuilder.getRawMany).not.toHaveBeenCalled();
    });

    it('should return empty array for empty input', async () => {
      const result = await service.getSearchSuggestions('');

      expect(result).toEqual([]);
      expect(mockQueryBuilder.getRawMany).not.toHaveBeenCalled();
    });
  });

  describe('searchByKeyword', () => {
    it('should search articles by keyword in title and content', async () => {
      const expectedArticles = [mockArticle];
      mockArticleRepo.find.mockResolvedValue(expectedArticles);

      const result = await service.searchByKeyword('technology');

      expect(result).toEqual(expectedArticles);
      expect(mockArticleRepo.find).toHaveBeenCalledWith({
        where: [
          { articleTitle: expect.any(Object) },
          { articleContent: expect.any(Object) }
        ],
        order: { publishDate: 'DESC' }
      });
    });
  });

  describe('getArticlesByDateRange', () => {
    it('should get articles by date range', async () => {
      const expectedArticles = [mockArticle];
      mockArticleRepo.find.mockResolvedValue(expectedArticles);

      const result = await service.getArticlesByDateRange('2025-07-01', '2025-07-05');

      expect(result).toEqual(expectedArticles);
      expect(mockArticleRepo.find).toHaveBeenCalledWith({
        where: {
          publishDate: expect.any(Object) // Between condition
        },
        order: { publishDate: 'DESC' }
      });
    });

    it('should get all articles when no date range provided', async () => {
      const expectedArticles = [mockArticle];
      mockArticleRepo.find.mockResolvedValue(expectedArticles);

      const result = await service.getArticlesByDateRange();

      expect(result).toEqual(expectedArticles);
      expect(mockArticleRepo.find).toHaveBeenCalledWith({
        where: {},
        order: { publishDate: 'DESC' }
      });
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockArticleRepo.find.mockRejectedValue(new Error('Database connection failed'));

      const mockUser = { userID: 1, name: 'Test User', email: 'test@example.com' } as any;
      await expect(service.findAll(mockUser)).rejects.toThrow('Database connection failed');
    });

    it('should handle query builder errors', async () => {
      mockQueryBuilder.getMany.mockRejectedValue(new Error('Query failed'));

      await expect(service.getArticles()).rejects.toThrow('Query failed');
    });

    it('should handle search with special characters', async () => {
      const searchOptions: SearchOptions = {
        keyword: 'AI & ML (technology)'
      };
      const expectedArticles = [mockArticle];
      mockQueryBuilder.getMany.mockResolvedValue(expectedArticles);

      const result = await service.searchArticles(searchOptions);

      expect(result).toEqual(expectedArticles);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(LOWER(article.articleTitle) LIKE LOWER(:keyword) OR LOWER(article.articleContent) LIKE LOWER(:keyword))',
        { keyword: '%AI & ML (technology)%' }
      );
    });
  });
});
