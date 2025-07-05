import { Test, TestingModule } from '@nestjs/testing';
import { MailHelperService } from './mailer.service';
import { MailerService } from '@nestjs-modules/mailer';

describe('MailHelperService', () => {
  let service: MailHelperService;
  let mailerService: MailerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailHelperService,
        {
          provide: MailerService,
          useValue: { sendMail: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<MailHelperService>(MailHelperService);
    mailerService = module.get<MailerService>(MailerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call mailerService.sendMail with correct params', async () => {
    const user = { email: 'priyanshusuhalka2001@gmail.com', name: 'Test User' } as any;
    const article = {
      articleTitle: 'Test Article',
      articleContent: 'This is a test article content.',
      URL: 'http://example.com/article',
      category: { categoryName: 'Tech' },
    } as any;
    await service.sendArticleNotification(user, article);
    expect(mailerService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: user.email,
        subject: expect.stringContaining('Tech'),
        html: expect.stringContaining('Test Article'),
      })
    );
  });
});
