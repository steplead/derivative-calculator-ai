/**
 * Tests for /api/integral — Integral Quality Sprint
 *
 * Covers:
 *  - polynomial (x^2), sin(x), 1/x symbolic results
 *  - empty equation → 400
 *  - invalid expression → 400
 *  - includeAi=false → no AI call, no cache, symbolic only
 *  - OPENROUTER_API_KEY missing → no AI call
 *  - AI normal response → integral:v2 cache write
 *  - AI failure → extractRealContent fallback
 *  - Redis cache HIT → no OpenRouter call
 */

// ============================================================
// MOCKS — jest.mock calls hoisted by transformer
// ============================================================

// eslint-disable-next-line no-var
var mockCompletionsCreate: jest.Mock;
// eslint-disable-next-line no-var
var mockGetCache: jest.Mock;
// eslint-disable-next-line no-var
var mockSetCache: jest.Mock;
// eslint-disable-next-line no-var
var mockPerformSecurity: jest.Mock;
// eslint-disable-next-line no-var
var mockTrackPath: jest.Mock;
// eslint-disable-next-line no-var
var mockExtractReal: jest.Mock;
// eslint-disable-next-line no-var
var mockNerdamer: jest.Mock;

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body: any, init?: any) => ({
      status: init?.status ?? 200,
      headers: new Map(Object.entries(init?.headers ?? {})),
      body,
    })),
  },
}));

jest.mock('nerdamer', () => {
  mockNerdamer = jest.fn();
  return { __esModule: true, default: mockNerdamer };
});
jest.mock('nerdamer/Calculus', () => jest.fn());

jest.mock('openai', () => {
  mockCompletionsCreate = jest.fn();
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: { completions: { create: mockCompletionsCreate } },
    })),
  };
});

jest.mock('@/utils/cache', () => {
  mockGetCache = jest.fn();
  mockSetCache = jest.fn();
  return {
    getCachedExplanation: mockGetCache,
    setCachedExplanation: mockSetCache,
  };
});

jest.mock('@/utils/security', () => {
  mockPerformSecurity = jest.fn();
  return { performSecurityCheck: mockPerformSecurity };
});

jest.mock('@/utils/path-tracker', () => {
  mockTrackPath = jest.fn(() => Promise.resolve());
  return { trackPath: mockTrackPath };
});

jest.mock('@/utils/validate-ai-content', () => {
  mockExtractReal = jest.fn();
  return { extractRealContent: mockExtractReal };
});

// ============================================================
// IMPORTS
// ============================================================
import { NextResponse } from 'next/server';
import { GET } from '@/app/api/integral/route';

// ============================================================
// HELPERS
// ============================================================

function req(path: string): any {
  return { url: `https://derivativecalculatorai.com${path}` };
}

function setupNerdamer(result: string) {
  mockNerdamer.mockReturnValue({
    toTeX: () => result,
    toString: () => result,
  });
}

function passSecurity() {
  mockPerformSecurity.mockResolvedValue({ success: true, blocked: false });
}

function mockAISuccess(explanation: string, steps: string) {
  mockCompletionsCreate.mockResolvedValue({
    choices: [
      { message: { content: JSON.stringify({ explanation, steps }) } },
    ],
  });
}

function defaultExtractReal() {
  mockExtractReal.mockImplementation(
    (_type: string, _expr: string, _result: string, explanation?: string, steps?: string) => {
      if (explanation && steps) {
        return {
          explanation,
          steps,
          quality: { isValid: true, score: 85, issues: [], recommendations: [] },
        };
      }
      return {
        explanation: `Fallback explanation for ${_expr}`,
        steps: `Fallback steps for ${_expr}`,
        quality: { isValid: true, score: 75, issues: [], recommendations: [] },
      };
    }
  );
}

// ============================================================
// BEFORE / AFTER
// ============================================================

beforeEach(() => {
  jest.clearAllMocks();
  process.env.OPENROUTER_API_KEY = 'sk-test-key';
  mockGetCache.mockResolvedValue(null);
  mockSetCache.mockResolvedValue(undefined);
  passSecurity();
  setupNerdamer('x^3/3');
  defaultExtractReal();
});

afterEach(() => {
  delete process.env.OPENROUTER_API_KEY;
});

// ============================================================
// TESTS
// ============================================================

describe('GET /api/integral', () => {

  // ---- Symbolic computation ----

  test('integral of x^2 returns symbolic result with AI explanation', async () => {
    setupNerdamer('x^3/3');
    mockAISuccess(
      'The integral of x^2 uses the power rule in reverse.',
      'Step 1: Identify the integrand as x^2, a simple polynomial. Step 2: Apply the power rule for integration: ∫ x^n dx = x^(n+1)/(n+1) + C. Step 3: Here n=2, so the antiderivative is x^3/3 + C.'
    );

    const res: any = await GET(req('/api/integral?equation=x%5E2'));

    expect(res.status).toBe(200);
    expect(res.body.solution).toContain('x^3');
    expect(res.body.solution_raw).toContain('x^3');
    expect(res.body.steps.length).toBeGreaterThan(50);
    expect(res.body.ai_explanation.length).toBeGreaterThan(20);

    // Cache write MUST use integral:v2: prefix
    expect(mockSetCache).toHaveBeenCalledTimes(1);
    const cacheKey: string = mockSetCache.mock.calls[0][0];
    expect(cacheKey).toMatch(/^integral:v2:/);
  });

  test('integral of sin(x) returns -cos(x) + C', async () => {
    setupNerdamer('-cos(x)');
    mockAISuccess(
      'The integral of sin(x) uses the known antiderivative from basic trigonometric integration formulas.',
      'Step 1: Recall the basic derivative d/dx[cos(x)] = -sin(x). Step 2: Therefore d/dx[-cos(x)] = sin(x). Step 3: The antiderivative of sin(x) is -cos(x) + C. Step 4: Add the constant of integration.'
    );

    const res: any = await GET(req('/api/integral?equation=sin(x)'));

    expect(res.status).toBe(200);
    expect(res.body.solution).toContain('-cos');
    expect(res.body.solution).toContain('C');
  });

  test('integral of 1/x returns log result with +C', async () => {
    setupNerdamer('log(x)');
    mockAISuccess(
      'The integral of 1 over x equals the natural logarithm of the absolute value of x, a fundamental result in calculus.',
      'Step 1: Recognize the integrand as 1/x, a special case. Step 2: Recall d/dx[ln(x)] = 1/x for x > 0. Step 3: The antiderivative is ln|x| + C, using absolute value for domain x ≠ 0. Step 4: Add integration constant.'
    );

    const res: any = await GET(req('/api/integral?equation=1%2Fx'));

    expect(res.status).toBe(200);
    expect(res.body.solution).toMatch(/log/);
    expect(res.body.solution).toContain('C');
  });

  // ---- Error handling ----

  test('empty equation returns 400', async () => {
    const res: any = await GET(req('/api/integral'));

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('invalid expression returns 400', async () => {
    const res: any = await GET(req('/api/integral?equation=what-is-a-good-integral-method'));

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid/i);
  });

  test('rate limited returns 429', async () => {
    mockPerformSecurity.mockResolvedValue({
      success: false, blocked: false, error: 'Rate limit exceeded', retryAfter: 60,
    });
    const res: any = await GET(req('/api/integral?equation=x%5E2'));

    expect(res.status).toBe(429);
  });

  // ---- includeAi=false ----

  test('includeAi=false does not call OpenRouter', async () => {
    setupNerdamer('x^3/3');

    const res: any = await GET(req('/api/integral?equation=x%5E2&includeAi=false'));

    expect(res.status).toBe(200);
    expect(res.body.solution).toContain('x^3');

    // Must NOT call AI or cache
    expect(mockCompletionsCreate).not.toHaveBeenCalled();
    expect(mockGetCache).not.toHaveBeenCalled();
    expect(mockSetCache).not.toHaveBeenCalled();

    // Symbolic result must still be present
    expect(res.body.solution_raw).toBe('x^3/3');
    expect(res.body.ai_explanation).toMatch(/unavailable/i);
  });

  test('includeAi=false returns 200 with no-store', async () => {
    setupNerdamer('x^4/4');
    const res: any = await GET(req('/api/integral?equation=x%5E3&includeAi=false'));

    expect(res.status).toBe(200);
    const headers = res.headers as Map<string, string>;
    expect(headers.get('Cache-Control')).toContain('no-store');
  });

  // ---- OPENROUTER_API_KEY missing ----

  test('API_KEY missing does not call AI', async () => {
    delete process.env.OPENROUTER_API_KEY;
    setupNerdamer('x^2/2');

    const res: any = await GET(req('/api/integral?equation=x'));

    expect(res.status).toBe(200);
    expect(res.body.solution).toContain('x^2');
    expect(mockCompletionsCreate).not.toHaveBeenCalled();
  });

  // ---- AI normal response → cache ----

  test('AI success writes to integral:v2 cache key', async () => {
    setupNerdamer('x^3/3');
    mockAISuccess(
      'The integral of x squared is found by applying the power rule in reverse, yielding x cubed over three.',
      'Step 1: Recognize the form x^2 as a polynomial. Step 2: Apply the reverse power rule. Step 3: Increase exponent by 1 and divide. Step 4: Add constant of integration C. Final: x^3/3 + C.'
    );

    await GET(req('/api/integral?equation=x%5E2'));

    expect(mockSetCache).toHaveBeenCalledTimes(1);
    const cacheKey: string = mockSetCache.mock.calls[0][0];
    expect(cacheKey).toMatch(/^integral:v2:/);
  });

  // ---- AI failure → fallback ----

  test('AI retry exhaustion uses extractRealContent fallback', async () => {
    setupNerdamer('x^3/3');
    // Fail all 3 attempts (initial + 2 retries)
    mockCompletionsCreate
      .mockRejectedValueOnce(new Error('timeout'))
      .mockRejectedValueOnce(new Error('timeout'))
      .mockRejectedValueOnce(new Error('timeout'));

    mockExtractReal.mockImplementation(
      (_type: string, _expr: string, _result: string, _explanation?: string, _steps?: string) => ({
        explanation: `Fallback: integration of ${_expr}`,
        steps: `Fallback: ∫ ${_expr} dx`,
        quality: { isValid: true, score: 75, issues: [], recommendations: [] },
      })
    );

    const res: any = await GET(req('/api/integral?equation=x%5E2'));

    expect(res.status).toBe(200);

    // Symbolic result preserved regardless of AI failure
    expect(res.body.solution).toContain('x^3');

    // Fallback content present
    expect(res.body.ai_explanation).toContain('Fallback');
    expect(res.body.steps).toContain('Fallback');

    // extractRealContent was called for the fallback (second call with no AI content)
    expect(mockExtractReal).toHaveBeenCalled();

    // AI was attempted with retries
    expect(mockCompletionsCreate).toHaveBeenCalledTimes(3);
  });

  // ---- Redis cache HIT ----

  test('cache HIT returns cached content without calling OpenRouter', async () => {
    setupNerdamer('x^3/3');
    const cachedData = JSON.stringify({
      explanation: 'Cached: power rule integral.',
      steps: 'Cached: Step 1. Cached: Step 2.',
    });
    mockGetCache.mockResolvedValue(cachedData);

    // Don't set up AI success — if AI is called the test fails
    mockCompletionsCreate.mockRejectedValue(new Error('AI should not be called'));

    const res: any = await GET(req('/api/integral?equation=x%5E2'));

    expect(res.status).toBe(200);
    expect(res.body.ai_explanation).toContain('Cached');
    expect(res.body.steps).toContain('Cached');

    // Must NOT call OpenRouter
    expect(mockCompletionsCreate).not.toHaveBeenCalled();

    // Cache read was attempted with integral:v2: key
    expect(mockGetCache).toHaveBeenCalledTimes(1);
    const cacheKey: string = mockGetCache.mock.calls[0][0];
    expect(cacheKey).toMatch(/^integral:v2:/);
  });
});
