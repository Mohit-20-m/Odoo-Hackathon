# services/exchange_service.py
import requests

# Using ExchangeRate-API for conversion
EXCHANGE_API_URL = "https://api.exchangerate-api.com/v4/latest/{BASE_CURRENCY}"

def convert_currency(base_currency, target_currency, amount):
    """
    Fetches the exchange rate and converts the amount.
    Returns the converted amount (float) or None on failure.
    NOTE: This API uses the request currency (base_currency) as the numerator.
    """
    if base_currency == target_currency:
        return float(amount)

    url = EXCHANGE_API_URL.format(BASE_CURRENCY=base_currency)
    
    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        rates = data.get('rates', {})
        if target_currency in rates:
            # Rate is X target units per 1 base unit (e.g., 1 USD = 83 INR)
            rate = rates[target_currency]
            
            # Converted Amount = Submitted Amount * Rate
            converted_amount = float(amount) * rate 
            
            return round(converted_amount, 2)

    except requests.exceptions.RequestException as e:
        print(f"Error fetching exchange rate: {e}")

    # Fallback/Error return
    return None