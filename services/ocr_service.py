# services/ocr_service.py
from google.cloud import vision
import io
import re
import base64

# Initialize the Vision client globally
# NOTE: It relies on the GOOGLE_APPLICATION_CREDENTIALS env var
try:
    client = vision.ImageAnnotatorClient()
except Exception as e:
    print(f"Vision client initialization failed: {e}")
    client = None

def extract_text_from_image(image_base64_data):
    """Detects text (OCR) in an image provided as base64 data."""
    if not client:
        return {"error": "Vision client not initialized. Check GOOGLE_APPLICATION_CREDENTIALS."}

    try:
        # --- FIX APPLIED HERE ---
        # 1. Decode the Base64 string into raw image bytes.
        image_bytes = base64.b64decode(image_base64_data)
        
        # 2. Create the Vision Image object directly from the raw bytes.
        image = vision.Image(content=image_bytes)
        # ------------------------

        # Perform the text detection
        response = client.text_detection(image=image)
        
        # Get the full detected text (first element of 'text_annotations')
        full_text = response.text_annotations[0].description if response.text_annotations else ""
        
        # Basic heuristic to find amount and currency (highly simplified)
        # Looks for patterns like 'USD 100.00' or 'TOTAL 5000 INR'
        
        # Pattern for common currency symbols/codes followed by a number
        currency_pattern = r'([A-Z]{3}|\$|€|£|¥)\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)'
        
        # Find all matches
        matches = re.findall(currency_pattern, full_text, re.IGNORECASE)
        
        extracted_data = {
            'full_text': full_text,
            'suggested_amount': None,
            'suggested_currency': None,
            'suggested_category': 'Miscellaneous' # Default category
        }

        if matches:
            # We assume the last match is the total amount
            last_match = matches[-1]
            currency_symbol = last_match[0].upper()
            amount_str = last_match[1].replace(',', '') # Clean up thousand separators
            
            # Convert common symbols to codes
            if currency_symbol == '$': suggested_currency = 'USD'
            elif currency_symbol == '€': suggested_currency = 'EUR'
            elif currency_symbol == '£': suggested_currency = 'GBP'
            elif currency_symbol == '¥': suggested_currency = 'JPY'
            else: suggested_currency = currency_symbol # Keep 3-letter code
            
            extracted_data['suggested_amount'] = float(amount_str)
            extracted_data['suggested_currency'] = suggested_currency
            
            # Simple keyword categorization (for demo)
            if re.search(r'uber|taxi|transport|flight|train', full_text, re.IGNORECASE):
                extracted_data['suggested_category'] = 'Travel'
            elif re.search(r'hotel|lodging|inn|resort', full_text, re.IGNORECASE):
                extracted_data['suggested_category'] = 'Lodging'
            elif re.search(r'food|restaurant|cafe|dinner', full_text, re.IGNORECASE):
                extracted_data['suggested_category'] = 'Food'

        return extracted_data

    except Exception as e:
        # Added check for common Base64 padding error
        if 'incorrect padding' in str(e).lower():
             return {"error": "OCR processing failed: Invalid Base64 string (padding error)."}
        
        print(f"OCR processing error: {e}")
        return {"error": f"OCR processing failed: {e}"}