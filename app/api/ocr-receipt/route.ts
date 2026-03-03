import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/utils/apiAuth';

/** Detect MIME type from file name and type field */
function detectMimeType(file: File): string {
  // Trust the browser-provided type if present
  if (file.type && file.type !== 'application/octet-stream') {
    return file.type;
  }
  // Fall back to extension
  const ext = file.name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return 'application/pdf';
    case 'png': return 'image/png';
    case 'gif': return 'image/gif';
    case 'webp': return 'image/webp';
    case 'heic': return 'image/heic';
    default: return 'image/jpeg';
  }
}

const OCR_PROMPT = `Analyze this receipt and extract detailed information in JSON format:
{
  "vendor": "merchant/vendor name",
  "receipt_type": "one of: retail, restaurant, hotel, gas, parking, airline, car_rental, service",
  "subtotal": "subtotal amount before tax as a number (no currency symbols)",
  "tax_amount": "tax amount as a number (no currency symbols), use 0 if no tax shown",
  "tax_rate": "tax rate as a percentage number if shown (e.g., 8.25), otherwise null",
  "amount": "total amount including tax as a number (no currency symbols)",
  "date": "date in YYYY-MM-DD format",
  "description": "brief description of purchase",
  "payment_method": "payment method if visible (credit, debit, cash, etc.), otherwise null",
  "check_in_date": "for hotel receipts only: check-in date in YYYY-MM-DD format, otherwise null",
  "check_out_date": "for hotel receipts only: check-out date in YYYY-MM-DD format, otherwise null",
  "number_of_nights": "for hotel receipts only: number of nights as a number, otherwise null",
  "room_number": "for hotel receipts only: room number as string, otherwise null",
  "line_items": [
    {
      "name": "item name/description",
      "quantity": "quantity as a number (default 1 if not shown)",
      "unit_price": "price per unit as a number",
      "line_total": "total for this line as a number",
      "unit": "unit of measure if shown (ea, lb, oz, gal, night, etc.), otherwise null",
      "category_hint": "one of: room_rate, resort_fee, parking, tax, food, beverage, service_charge, tip, fuel, merchandise, service, other"
    }
  ]
}

IMPORTANT RULES:
- For line_items, extract EVERY individual item/charge on the receipt.
- Include the item name exactly as shown.
- quantity: use the quantity shown, or 1 if not specified.
- unit_price: the price per single unit.
- line_total: quantity × unit_price (the extended price shown).
- unit: extract any unit of measure (lb, oz, gal, each, night, etc.).
- category_hint: classify each line item for auto-categorization.

HOTEL RECEIPTS:
- Extract room rate as a line item with unit="night" and quantity=number of nights.
- Separate out resort fees, parking charges, incidental charges, and each tax type as individual line items.
- Set check_in_date, check_out_date, number_of_nights, and room_number fields.
- The "amount" should be the total folio balance / amount due.

GAS/FUEL RECEIPTS:
- Extract the gallons as quantity and price per gallon as unit_price.

RESTAURANT RECEIPTS:
- Separate food items, tax, tip/gratuity as individual line items.

If any field is not clearly visible, use null. Be precise with amounts and date.
The subtotal should be the amount before tax, and amount should be the final total.`;

export async function POST(request: NextRequest) {
  const { user, error: authError } = await getAuthenticatedUser(request);
  if (authError) return authError;

  try {
    const formData = await request.formData();
    const file = formData.get('receipt') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const mimeType = detectMimeType(file);
    const isPdf = mimeType === 'application/pdf';

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = buffer.toString('base64');

    // Call OpenAI GPT-4 Vision API
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Use gpt-4o for PDFs (native PDF support), gpt-4o-mini for images
    const model = isPdf ? 'gpt-4o' : 'gpt-4o-mini';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: OCR_PROMPT,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Data}`
                }
              }
            ]
          }
        ],
        max_tokens: 3000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      return NextResponse.json(
        { error: 'Failed to process receipt with AI' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'Could not parse receipt data' },
        { status: 500 }
      );
    }

    const extractedData = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      success: true,
      data: extractedData,
    });

  } catch (error: any) {
    console.error('OCR processing error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process receipt' },
      { status: 500 }
    );
  }
}
