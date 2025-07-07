// src/shared/mailer/mailer.service.ts
import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { User } from '@modules/users/user.entity';
import { Article } from '@modules/articles/article.entity';

@Injectable()
export class MailHelperService {
  constructor(private readonly mailer: MailerService) {}

  async sendArticleNotification(user: User, article: Article) {
    return this.mailer.sendMail({
      to: user.email,
      subject: `📰 New Article in ${article.category?.categoryName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <p>Hello ${user.name || user.email},</p>
          <p>A new article was posted:</p>
          <h3 style="color: #333; margin-bottom: 10px;">${article.articleTitle}</h3>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; line-height: 1.6;">
            <p style="margin: 0; white-space: pre-wrap;">${article.articleContent || 'No content available.'}</p>
          </div>
          ${article.URL ? `<p><a href="${article.URL}" style="color: #007bff; text-decoration: none;">🔗 Read original article</a></p>` : ''}
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <small style="color: #6c757d;">You received this notification because you subscribed to ${article.category?.categoryName}.</small>
        </div>
      `,
    });
  }

  async sendArticleReportNotification(admins: User[], article: Article, reportedBy: User, currentReportCount: number) {
    const adminEmails = admins.map(admin => admin.email).filter(email => email);
    
    if (adminEmails.length === 0) {
      throw new Error('No admin emails found');
    }

    const emailPromises = adminEmails.map(adminEmail => 
      this.mailer.sendMail({
        to: adminEmail,
        subject: `🚨 Article Reported - Review Required (Report #${currentReportCount})`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc3545;">🚨 Article Report Alert</h2>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3 style="margin-top: 0; color: #495057;">Article Details:</h3>
              <p><strong>Title:</strong> ${article.articleTitle}</p>
              <p><strong>Article ID:</strong> ${article.articleID}</p>
              <p><strong>Source:</strong> ${article.source}</p>
              <p><strong>Category:</strong> ${article.category?.categoryName || 'N/A'}</p>
              <p><strong>Published:</strong> ${article.publishDate}</p>
              ${article.URL ? `<p><strong>URL:</strong> <a href="${article.URL}">${article.URL}</a></p>` : ''}
            </div>

            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3 style="margin-top: 0; color: #856404;">Report Information:</h3>
              <p><strong>Reported by:</strong> ${reportedBy.name} (${reportedBy.email})</p>
              <p><strong>Report Count:</strong> ${currentReportCount} report${currentReportCount !== 1 ? 's' : ''}</p>
              <p><strong>Report Time:</strong> ${new Date().toLocaleString()}</p>
              ${currentReportCount >= 5 ? '<p style="color: #dc3545;"><strong>⚠️ Article has been automatically hidden due to multiple reports</strong></p>' : ''}
            </div>

            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3 style="margin-top: 0; color: #495057;">Article Preview:</h3>
              <p style="font-style: italic;">${article.articleContent?.slice(0, 500)}${article.articleContent?.length > 500 ? '...' : ''}</p>
            </div>

            <div style="background-color: #d1ecf1; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3 style="margin-top: 0; color: #0c5460;">Admin Action Required:</h3>
              <p>Please review this article for potential policy violations or inappropriate content.</p>
              <p>Log in to the admin panel to take appropriate action (hide article, investigate further, etc.).</p>
            </div>

            <hr style="margin: 20px 0;">
            <p style="color: #6c757d; font-size: 12px;">
              This is an automated notification from the News Aggregator System.<br>
              Time: ${new Date().toLocaleString()}
            </p>
          </div>
        `,
      })
    );

    return Promise.allSettled(emailPromises);
  }
}
