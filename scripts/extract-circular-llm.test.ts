import { describe, expect, it } from 'vitest';
import { extractCircularOffline, extractCircularWithLLM } from './extract-circular-llm';

describe('Circular Extraction Agent (LLM & Offline Engine)', () => {
  const sampleSBIHtml = `
    <html>
      <body>
        <h1>State Bank of India - Domestic Term Deposits (Below Rs. 3 Crore)</h1>
        <p>Interest Rates w.e.f. October 15, 2024</p>
        <table>
          <tr><th>Tenure</th><th>General Public</th><th>Senior Citizens</th></tr>
          <tr><td>1 Year to less than 2 Years</td><td>6.80%</td><td>7.30%</td></tr>
          <tr><td>2 Years to less than 3 Years</td><td>7.00%</td><td>7.50%</td></tr>
          <tr><td>3 Years to less than 5 Years</td><td>6.75%</td><td>7.25%</td></tr>
          <tr><td>5 Years and up to 10 Years</td><td>6.50%</td><td>7.50%</td></tr>
        </table>
      </body>
    </html>
  `;

  it('correctly extracts structured rates from sample circular text via offline parser', () => {
    const result = extractCircularOffline({
      bankId: 'sbi-bank',
      circularUrl: 'https://sbi.co.in/web/interest-rates/deposit-rates/retail-domestic-term-deposits',
      rawContent: sampleSBIHtml,
    });

    expect(result.success).toBe(true);
    expect(result.update).toBeDefined();
    expect(result.update?.bankId).toBe('sbi-bank');
    expect(result.update?.ratesByTenure['12']).toBe(6.80);
    expect(result.update?.ratesByTenure['24']).toBe(7.00);
    expect(result.update?.ratesByTenure['36']).toBe(6.75);
    expect(result.update?.ratesByTenure['60']).toBe(6.50);
    expect(result.update?.effectiveDate).toContain('October 15, 2024');
    expect(result.update?.verificationStatus).toBe('circular_verified');
    expect(result.diff).toBeDefined();
  });

  it('rejects extraction if bankId is invalid', () => {
    const result = extractCircularOffline({
      bankId: 'non-existent-bank-xyz',
      rawContent: sampleSBIHtml,
    });

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('Unknown bankId');
  });

  it('fails gracefully when LLM is invoked without GEMINI_API_KEY', async () => {
    const result = await extractCircularWithLLM({
      bankId: 'sbi-bank',
      rawContent: sampleSBIHtml,
      apiKey: '', // Empty API key
    });

    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('GEMINI_API_KEY');
  });

  it('rejects content that contains no discernible tenure rates', () => {
    const invalidContent = 'Hello world, this is a general blog post about personal finance with no rates.';
    const result = extractCircularOffline({
      bankId: 'sbi-bank',
      rawContent: invalidContent,
    });

    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('No valid tenure rates found');
  });
});

