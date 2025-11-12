import * as ImagePicker from 'expo-image-picker';
import TextRecognition from '@react-native-ml-kit/text-recognition';

export interface ReceiptData {
  amount?: number;
  subtotal?: number;
  tax?: number;
  tip?: number;
  total?: number;
  date?: string;
  merchant?: string;
  rawText: string;
  imageUri?: string;
}

/**
 * Request camera permissions
 */
export const requestCameraPermissions = async (): Promise<boolean> => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
};

/**
 * Request media library permissions
 */
export const requestMediaPermissions = async (): Promise<boolean> => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
};

/**
 * Take a photo of a receipt
 */
export const takeReceiptPhoto = async (): Promise<string | null> => {
  try {
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) {
      throw new Error('Camera permission not granted');
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 1,
    });

    if (result.canceled) {
      return null;
    }

    return result.assets[0].uri;
  } catch (error) {
    console.error('Error taking photo:', error);
    throw error;
  }
};

/**
 * Pick a receipt image from gallery
 */
export const pickReceiptImage = async (): Promise<string | null> => {
  try {
    const hasPermission = await requestMediaPermissions();
    if (!hasPermission) {
      throw new Error('Media library permission not granted');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 1,
    });

    if (result.canceled) {
      return null;
    }

    return result.assets[0].uri;
  } catch (error) {
    console.error('Error picking image:', error);
    throw error;
  }
};

/**
 * Extract text from image using ML Kit
 */
export const extractTextFromImage = async (imageUri: string): Promise<string> => {
  try {
    
    // Allow mock mode for Expo Go / no-dev-client scenarios
    const mock = process.env.EXPO_PUBLIC_MOCK_NATIVE === 'true';
    const canRecognize = (TextRecognition as any)?.recognize;

    if (mock || !canRecognize) {
      // Return a realistic sample text for parsing during local testing
      return [
        'MC SMART COFFEE',
        '123 Market St',
        'CITY, ST 12345',
        '',
        'Receipt #12345',
        'Date: 10/20/2025',
        'Latte                $4.50',
        'Muffin               $4.00',
        'Subtotal:            $8.50',
        'Tax:                 $0.68',
        'Total:               $9.18',
      ].join('\n');
    }

    const result = await (TextRecognition as any).recognize(imageUri);
    return result.text;
    
  } catch (error) {
    console.error('Error extracting text:', error);
    throw new Error('Failed to extract text from image');
  }
};

/**
 * Parse all monetary amounts from receipt text
 * Captures subtotal, tax, tip, and total separately for tax purposes
 */
const parseReceiptAmounts = (text: string) => {
  const result: {
    subtotal?: number;
    tax?: number;
    tip?: number;
    total?: number;
  } = {};

  // Helper function to extract number from string
  const extractNumber = (str: string): number | undefined => {
    const cleaned = str.replace(/[,$]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) || num <= 0 ? undefined : num;
  };

  // Helper to try multiple patterns and extract first match
  const tryPatterns = (patterns: RegExp[]): number | undefined => {
    for (const pattern of patterns) {
      const match = pattern.exec(text);
      if (match && match[1]) {
        const num = extractNumber(match[1]);
        if (num !== undefined) return num;
      }
    }
    return undefined;
  };

  // Parse Subtotal (with more flexible patterns)
  const subtotalPatterns = [
    /sub[\s-]?total[:\s]*\$?\s*([\d,]+\.?\d{0,2})/i,
    /subtotal[:\s]*\$?\s*([\d,]+\.?\d{0,2})/i,
    /sub[\s-]tot[:\s]*\$?\s*([\d,]+\.?\d{0,2})/i,
  ];
  result.subtotal = tryPatterns(subtotalPatterns);

  // Parse Tax (with more flexible patterns)
  const taxPatterns = [
    /tax[:\s]*\$?\s*([\d,]+\.?\d{0,2})/i,
    /sales\s+tax[:\s]*\$?\s*([\d,]+\.?\d{0,2})/i,
    /total\s+tax[:\s]*\$?\s*([\d,]+\.?\d{0,2})/i,
    /tax\s*amt[:\s]*\$?\s*([\d,]+\.?\d{0,2})/i,
    /tax\s*\d*[:\s]*\$?\s*([\d,]+\.?\d{0,2})/i, // TAX1, TAX 1
    /gst[:\s]*\$?\s*([\d,]+\.?\d{0,2})/i,
    /vat[:\s]*\$?\s*([\d,]+\.?\d{0,2})/i,
    /hst[:\s]*\$?\s*([\d,]+\.?\d{0,2})/i,
  ];
  result.tax = tryPatterns(taxPatterns);

  // Parse Tip
  const tipPatterns = [
    /tip[:\s]*\$?\s*([\d,]+\.?\d{0,2})/i,
    /gratuity[:\s]*\$?\s*([\d,]+\.?\d{0,2})/i,
  ];
  result.tip = tryPatterns(tipPatterns);

  // Parse Total (final amount) - with more variations
  const totalPatterns = [
    /(?:^|\n)\s*total[:\s]*\$?\s*([\d,]+\.?\d{0,2})/i,
    /grand[\s-]?total[:\s]*\$?\s*([\d,]+\.?\d{0,2})/i,
    /amount[\s-]?due[:\s]*\$?\s*([\d,]+\.?\d{0,2})/i,
    /balance[\s-]?due[:\s]*\$?\s*([\d,]+\.?\d{0,2})/i,
    /total[\s-]?amount[:\s]*\$?\s*([\d,]+\.?\d{0,2})/i,
    /final[\s-]?total[:\s]*\$?\s*([\d,]+\.?\d{0,2})/i,
  ];
  result.total = tryPatterns(totalPatterns);

  // Fallback: If no total found, look for any dollar amount on its own line
  if (!result.total && !result.subtotal) {
    const amountOnlyPattern = /(?:^|\n)\s*\$\s*([\d,]+\.\d{2})\s*(?:\n|$)/;
    const match = amountOnlyPattern.exec(text);
    if (match && match[1]) {
      const amount = extractNumber(match[1]);
      if (amount && amount > 1) { // Ignore tiny amounts
        result.total = amount;
      }
    }
  }

  // If we have subtotal and tax but no total, calculate it
  if (result.subtotal && result.tax && !result.total) {
    result.total = result.subtotal + result.tax + (result.tip || 0);
  }

  // If we only found a total but no subtotal, use total for both
  if (result.total && !result.subtotal) {
    result.subtotal = result.total;
  }

  // Fallback: pick the largest currency value if nothing matched
  if (!result.total && !result.subtotal) {
    const currencyRegex = /\$\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})|[0-9]+(?:\.[0-9]{2}))/g;
    let m: RegExpExecArray | null;
    let max = 0;
    while ((m = currencyRegex.exec(text)) !== null) {
      const n = parseFloat(m[1].replace(/,/g, ''));
      if (!isNaN(n) && n > max) max = n;
    }
    if (max > 0) {
      result.total = max;
      if (!result.subtotal) result.subtotal = max;
    }
  }

  return result;
};

/**
 * Parse date from receipt text
 * Looks for common date patterns
 */
const parseDate = (text: string): string | undefined => {
  // Common date patterns
  const patterns = [
    /(\d{1,2})[\\/\-](\d{1,2})[\\/\-](\d{2,4})/,
    /(\d{4})[\\/\-](\d{1,2})[\\/\-](\d{1,2})/,
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2}),?\s+(\d{2,4})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        let date: Date;

        if (pattern === patterns[0]) {
          // MM/DD/YYYY or MM-DD-YYYY
          const [, month, day, year] = match;
          const fullYear = year.length === 2 ? `20${year}` : year;
          date = new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
        } else if (pattern === patterns[1]) {
          // YYYY/MM/DD or YYYY-MM-DD
          const [, year, month, day] = match;
          date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
        } else {
          // Month Name Day, Year
          const [, month, day, year] = match;
          const fullYear = year.length === 2 ? `20${year}` : year;
          date = new Date(`${month} ${day}, ${fullYear}`);
        }

        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      } catch (error) {
        console.error('Error parsing date:', error);
      }
    }
  }

  return undefined;
};

/**
 * Parse merchant name from receipt text
 * Looks for text at the top of the receipt (first few lines)
 */
const parseMerchant = (text: string): string | undefined => {
  // Get the first few lines (merchant name is usually at the top)
  const lines = text.split('\n').filter(line => line.trim().length > 0);

  if (lines.length > 0) {
    // Look for lines with mostly uppercase letters and no numbers (common for merchant names)
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i].trim();
      // Skip very short lines or lines with too many numbers
      if (line.length >= 3 && line.length <= 50) {
        const numCount = (line.match(/\d/g) || []).length;
        if (numCount / line.length < 0.3) {
          return line;
        }
      }
    }
  }

  return undefined;
};

/**
 * Parse receipt data from extracted text
 */
export const parseReceiptText = (text: string): ReceiptData => {
  const amounts = parseReceiptAmounts(text);

  return {
    // Use total as the main amount, fallback to subtotal if no total found
    amount: amounts.total || amounts.subtotal,
    subtotal: amounts.subtotal,
    tax: amounts.tax,
    tip: amounts.tip,
    total: amounts.total,
    date: parseDate(text),
    merchant: parseMerchant(text),
    rawText: text,
  };
};

/**
 * Full workflow: Take photo, extract text, and parse receipt data
 */
export const scanReceipt = async (source: 'camera' | 'gallery'): Promise<ReceiptData> => {
  try {
    // Get image
    const imageUri = source === 'camera'
      ? await takeReceiptPhoto()
      : await pickReceiptImage();

    if (!imageUri) {
      throw new Error('No image selected');
    }

    // Extract text
    const text = await extractTextFromImage(imageUri);

    // Parse data and include imageUri
    const receiptData = parseReceiptText(text);
    return {
      ...receiptData,
      imageUri,
    };
  } catch (error) {
    console.error('Error scanning receipt:', error);
    throw error;
  }
};
