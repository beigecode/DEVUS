/**
 * News Feed Integration
 * 
 * Fetches real-time headlines from RSS feeds for token inspiration.
 */

import { NewsHeadline } from './types';

// RSS feed sources
const RSS_FEEDS = [
  { url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', source: 'BBC Tech' },
  { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', source: 'BBC World' },
  { url: 'https://feeds.bbci.co.uk/news/business/rss.xml', source: 'BBC Business' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml', source: 'NYTimes Tech' },
  { url: 'https://www.theguardian.com/technology/rss', source: 'Guardian Tech' },
];

export class NewsClient {
  /**
   * Fetch headlines from RSS feeds
   */
  async fetchHeadlines(count: number = 10): Promise<NewsHeadline[]> {
    const allHeadlines: NewsHeadline[] = [];

    // Fetch from multiple feeds in parallel
    const results = await Promise.allSettled(
      RSS_FEEDS.map(feed => this.fetchFromFeed(feed.url, feed.source))
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        allHeadlines.push(...result.value);
      }
    }

    // Shuffle and return requested count
    return this.shuffle(allHeadlines).slice(0, count);
  }

  /**
   * Fetch headlines from a single RSS feed
   */
  private async fetchFromFeed(url: string, source: string): Promise<NewsHeadline[]> {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'DEVUS-SDK/1.0' },
      });

      if (!response.ok) {
        return [];
      }

      const xml = await response.text();
      return this.parseRSS(xml, source);
    } catch (error) {
      console.error(`Failed to fetch from ${source}:`, error);
      return [];
    }
  }

  /**
   * Parse RSS XML into NewsHeadline objects
   */
  private parseRSS(xml: string, source: string): NewsHeadline[] {
    const headlines: NewsHeadline[] = [];

    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/;
    const linkRegex = /<link>(.*?)<\/link>/;
    const pubDateRegex = /<pubDate>(.*?)<\/pubDate>/;
    const imagePatterns = [
      /media:thumbnail[^>]+url="([^"]+)"/i,
      /media:content[^>]+url="([^"]+)"/i,
      /<enclosure[^>]+url="([^"]+)"[^>]+type="image/i,
    ];

    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
      const item = match[1];
      const titleMatch = item.match(titleRegex);
      const linkMatch = item.match(linkRegex);
      const pubDateMatch = item.match(pubDateRegex);

      // Find image URL
      let imageUrl: string | undefined;
      for (const pattern of imagePatterns) {
        const imgMatch = item.match(pattern);
        if (imgMatch?.[1]) {
          imageUrl = imgMatch[1];
          break;
        }
      }

      if (titleMatch && linkMatch) {
        const title = (titleMatch[1] || titleMatch[2] || '').trim();
        const url = linkMatch[1].trim();

        if (title.length > 15 && url.startsWith('http')) {
          headlines.push({
            title,
            source,
            url: url.replace(/&amp;/g, '&'),
            imageUrl,
            pubDate: pubDateMatch?.[1],
          });
        }
      }
    }

    return headlines;
  }

  /**
   * Shuffle array (Fisher-Yates)
   */
  private shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}
