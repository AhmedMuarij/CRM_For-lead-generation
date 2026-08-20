import re


def normalize_phone(phone: str) -> str:
    """
    Normalize phone numbers for deduplication.
    Handles formats like: 03001234567, +923001234567, 0092-300-1234567, etc.
    Returns a canonical E.164-style string without the leading +.
    """
    if not phone:
        return ""

    # Strip all non-digit characters
    digits = re.sub(r"\D", "", phone)

    # Handle Pakistani numbers: 03xx -> 923xx
    if digits.startswith("0") and len(digits) == 11:
        digits = "92" + digits[1:]

    # Handle 0092xxxxxxxxxx format
    if digits.startswith("0092"):
        digits = "92" + digits[4:]

    return digits
