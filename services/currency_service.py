# services/currency_service.py
import requests

REST_COUNTRIES_URL = 'https://restcountries.com/v3.1/all?fields=name,currencies'

def get_currency_for_country(country_name='India'):
    try:
        response = requests.get(REST_COUNTRIES_URL, timeout=5)
        response.raise_for_status()
        countries = response.json()

        target_country = next((
            c for c in countries if c.get('name', {}).get('common', '').lower() == country_name.lower()
        ), None)

        if target_country and target_country.get('currencies'):
            currency_code = list(target_country['currencies'].keys())[0]
            return currency_code

    except requests.exceptions.RequestException as e:
        print(f"Error fetching country currency: {e}")

    # Fallback currency
    return 'USD'