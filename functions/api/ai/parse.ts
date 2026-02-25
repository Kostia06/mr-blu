import type { Env, AuthenticatedData } from '../../types';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  error?: { message: string; code: number };
}

async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 2048 },
    }),
  });

  const data: GeminiResponse = await response.json();

  if (data.error) {
    throw new Error(`Gemini API error: ${data.error.message}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('No response from Gemini API');
  }

  return text;
}

const PARSE_PROMPT = `You are a voice-to-document parser for a contractor invoicing app.

DETERMINE INTENT:
1. "document_action" - CREATE new invoice/estimate (default for most requests)
2. "information_query" - ASKING about existing data ("what invoices for John?", "how much last month?")
3. "document_clone" - COPY existing doc for different client ("same as John's for Mike")
4. "document_send" - SEND existing doc ("send Jackson's estimate", "email the invoice")
5. "document_transform" - CONVERT type ("turn estimate into invoice")

Convert ALL spoken/written numbers to digits:
- "five hundred"->500, "5k"->5000, "two thousand"->2000
- "eight thousand 892"->8892, "two thousand 100"->2100, "five 100"->500
- "twenty five hundred"->2500, "fifteen thousand"->15000
- ALWAYS output numbers as digits, never as words

RESPOND WITH VALID JSON ONLY:

FOR document_action:
{
  "intentType": "document_action",
  "documentType": "invoice" or "estimate",
  "client": {"name": "string or null", "firstName": "string or null", "lastName": "string or null", "email": "string or null", "phone": "string or null", "address": "string or null"},
  "items": [{"description": "string", "quantity": number, "unit": "string", "rate": number, "total": number, "material": "string or null", "measurementType": "sqft/linear_ft/unit/hour/job or null", "dimensions": {"width": number, "length": number, "unit": "ft"} or null}],
  "total": number,
  "taxRate": number or null,
  "taxes": [{"type": "GST/PST/HST/QST/CUSTOM", "name": "string", "rate": number}] or null,
  "dueDate": "YYYY-MM-DD or null",
  "actions": [{"type": "create_document/send_email/send_sms/save_draft", "order": number, "details": {"recipient": "string or null"}}],
  "summary": "Brief description of what will be created",
  "confidence": {"overall": 0-1, "client": 0-1, "items": 0-1, "actions": 0-1}
}

FOR information_query:
{
  "intentType": "information_query",
  "query": {"type": "list/sum/count", "documentTypes": ["invoice"], "clientName": "string or null", "status": "draft/sent/paid/pending/overdue or null", "dateRange": {"period": "this_month/last_month/this_week or null"}},
  "summary": "What user is asking",
  "naturalLanguageQuery": "Rephrased question",
  "confidence": {"overall": 0-1}
}

FOR document_clone:
{
  "intentType": "document_clone",
  "sourceClient": "client to copy FROM",
  "targetClient": {"name": "new client name"},
  "documentType": "invoice/estimate or null",
  "actions": [{"type": "create_document", "order": 1}],
  "summary": "Brief description",
  "confidence": {"overall": 0-1}
}

FOR document_send:
{
  "intentType": "document_send",
  "clientName": "client whose doc to send",
  "documentType": "invoice/estimate or null",
  "selector": "last/latest",
  "deliveryMethod": "email/sms/whatsapp",
  "recipient": {"email": null, "phone": null, "clientName": null},
  "summary": "Brief description",
  "confidence": {"overall": 0-1}
}

FOR document_transform:
{
  "intentType": "document_transform",
  "source": {"clientName": "string", "documentType": "invoice/estimate", "selector": "last"},
  "conversion": {"enabled": true, "targetType": "invoice/estimate"},
  "summary": "Brief description",
  "confidence": {"overall": 0-1}
}

KEY EXAMPLES:
- "Invoice for John 500 dollars" -> document_action with client.name="John", total=500
- "Invoice for Mike, flooring 24x26 ft for 3000" -> document_action with material="flooring", dimensions
- "What invoices did I send to John?" -> information_query
- "Same invoice as John for Mike" -> document_clone, sourceClient="John", targetClient.name="Mike"
- "Send Jackson's estimate" -> document_send, clientName="Jackson"
- "Turn Jackson's estimate into invoice" -> document_transform
- "plus GST" -> taxes with GST 5%
- "Ontario tax" -> taxes with HST 13%

MEASUREMENT TYPE RULES for items:
- For flat-rate services (labor, consultation, cleanup), use measurementType: "service" with quantity: 1
- For area-based work with dimensions (flooring, painting, decking), use measurementType: "sqft" with dimensions
- For linear work (trim, fencing, gutters), use measurementType: "linear_ft"
- For counted items (fixtures, outlets), use measurementType: "unit"
- For time-based work, use measurementType: "hour"
- Default to "service" when quantity is 1 and no specific unit applies

IMPORTANT: All item descriptions MUST be in English regardless of the input language. Translate any non-English item descriptions to English. Only translate item description text - keep client names, addresses, and other proper nouns as-is.

Tax rates should be whole percentages (e.g., 5 for 5%, 13 for 13%, NOT 0.05 or 0.13).

TRANSCRIPTION:
`;

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function sanitizeString(str: string, maxLength = 10000): string {
  return str.slice(0, maxLength).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
}

function buildFallbackResponse(transcription: string) {
  const data = {
    intentType: 'document_action',
    documentType: 'invoice',
    client: { name: null, firstName: null, lastName: null, email: null, phone: null, address: null },
    items: [],
    total: 0,
    taxRate: null,
    taxes: null,
    dueDate: null,
    actions: [{ type: 'create_document', order: 1, details: { recipient: null } }],
    summary: 'Could not parse transcription',
    confidence: { overall: 0, client: 0, items: 0, actions: 0 },
    rawTranscription: transcription,
  };
  return { success: false, intentType: 'document_action', data, error: 'Failed to parse' };
}

async function fetchPriceItems(
  env: Env,
  userId: string,
): Promise<string> {
  try {
    const response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/price_items?user_id=eq.${userId}&select=name,unit_price,unit,category&order=times_used.desc&limit=50`,
      {
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      },
    );
    if (!response.ok) return '';
    const items = (await response.json()) as Array<{
      name: string;
      unit_price: number;
      unit: string;
      category: string;
    }>;
    if (!items.length) return '';
    const lines = items.map(
      (p) => `- ${p.name}: $${p.unit_price}/${p.unit} (${p.category})`,
    );
    return `\nUSER'S PRICE BOOK (use these rates when items match):\n${lines.join('\n')}\n\nWhen a spoken item matches a price book entry, use the price book rate. Match flexibly (e.g. "flooring" matches "Flooring Install", "labor" matches "General Labor"). If the user explicitly states a different price, use the stated price instead.\n`;
  } catch {
    return '';
  }
}

export const onRequestPost: PagesFunction<Env, string, AuthenticatedData> = async ({
  request,
  env,
  data,
}) => {
  if (!env.GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'AI service not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const body = await request.json() as { transcription?: string };
  const transcription = body?.transcription;

  if (!transcription || typeof transcription !== 'string') {
    return new Response(
      JSON.stringify({ error: 'Missing transcription' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const sanitized = sanitizeString(transcription.trim());
  if (!sanitized) {
    return new Response(
      JSON.stringify({ error: 'Transcription is empty' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    const priceBookSection = await fetchPriceItems(env, data.user.id);
    const prompt = PARSE_PROMPT + priceBookSection + sanitized;
    const text = await callGemini(prompt, env.GEMINI_API_KEY);

    // Extract JSON from potential markdown code blocks
    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonStr);

    // Post-process document_action responses
    if (!parsed.intentType || parsed.intentType === 'document_action') {
      parsed.intentType = 'document_action';

      // Generate item IDs
      if (Array.isArray(parsed.items)) {
        for (const item of parsed.items) {
          if (!item.id) item.id = generateId();
          if (item.total == null && item.quantity && item.rate) {
            item.total = item.quantity * item.rate;
          }
        }
      } else {
        parsed.items = [];
      }

      // If total exists but no items, create a single line item
      if (parsed.total > 0 && parsed.items.length === 0) {
        parsed.items = [{
          id: generateId(),
          description: 'Service',
          quantity: 1,
          unit: 'service',
          rate: parsed.total,
          total: parsed.total,
          material: null,
          measurementType: 'service',
          dimensions: null,
        }];
      }

      // Calculate subtotal from items
      const subtotal = parsed.items.reduce(
        (sum: number, item: { total?: number }) => sum + (item.total || 0),
        0,
      );

      // Normalize tax rate (0.05 -> 5)
      if (parsed.taxRate != null && parsed.taxRate > 0 && parsed.taxRate < 1) {
        parsed.taxRate = Math.round(parsed.taxRate * 100);
      }

      // Calculate tax
      const taxRate = parsed.taxRate || 0;
      const taxAmount = taxRate > 0 ? subtotal * (taxRate / 100) : 0;

      parsed.subtotal = subtotal;
      parsed.taxAmount = taxAmount;
      parsed.total = subtotal + taxAmount;
    }

    const intentType = parsed.intentType || 'document_action';

    return new Response(
      JSON.stringify({ success: true, intentType, data: parsed }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('AI parse error:', errMsg);

    // Check for rate limit
    if (errMsg.includes('429') || errMsg.includes('quota')) {
      return new Response(
        JSON.stringify({ error: 'AI service rate limited. Please try again shortly.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const fallback = buildFallbackResponse(sanitized);
    fallback.error = `Parse failed: ${errMsg}`;
    fallback.data.summary = `Parse error: ${errMsg}`;
    return new Response(JSON.stringify(fallback), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
