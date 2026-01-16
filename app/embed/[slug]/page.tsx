/**
 * Embed Widget Route - Disabled
 * 
 * This route handles requests from embedded widgets on other websites.
 * Since widget functionality has been disabled to prevent abuse,
 * this route returns a simple static page informing users that the widget is no longer available.
 * 
 * This prevents 404 errors from consuming Cloudflare quota while still
 * providing a user-friendly message.
 */

export const runtime = 'edge';

interface PageProps {
    params: {
        slug: string;
    };
    searchParams: {
        theme?: string;
        preview?: string;
    };
}

export default function EmbedPage({ searchParams }: PageProps) {
    // Return a simple static page - no API calls, no JavaScript, minimal quota usage
    return (
        <html>
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>Widget Unavailable - Derivative Calculator AI</title>
                <style>{`
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                        margin: 0;
                        padding: 20px;
                        background: ${searchParams.theme === 'dark' ? '#1a1a1a' : '#ffffff'};
                        color: ${searchParams.theme === 'dark' ? '#e0e0e0' : '#333333'};
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        text-align: center;
                    }
                    .container {
                        max-width: 500px;
                        padding: 40px;
                        border-radius: 8px;
                        background: ${searchParams.theme === 'dark' ? '#2a2a2a' : '#f5f5f5'};
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    }
                    h1 {
                        font-size: 24px;
                        margin-bottom: 16px;
                        color: ${searchParams.theme === 'dark' ? '#ffffff' : '#333333'};
                    }
                    p {
                        font-size: 16px;
                        line-height: 1.6;
                        margin-bottom: 24px;
                        color: ${searchParams.theme === 'dark' ? '#cccccc' : '#666666'};
                    }
                    a {
                        color: #3b82f6;
                        text-decoration: none;
                        font-weight: 500;
                    }
                    a:hover {
                        text-decoration: underline;
                    }
                `}</style>
            </head>
            <body>
                <div className="container">
                    <h1>Widget Unavailable</h1>
                    <p>
                        The embed widget feature has been temporarily disabled to prevent abuse.
                        We apologize for any inconvenience.
                    </p>
                    <p>
                        Please visit{' '}
                        <a href="https://derivativecalculatorai.com" target="_blank" rel="noopener">
                            Derivative Calculator AI
                        </a>{' '}
                        to use our calculators directly.
                    </p>
                </div>
            </body>
        </html>
    );
}
