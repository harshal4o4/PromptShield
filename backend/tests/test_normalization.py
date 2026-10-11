from app.services.normalization import Normalizer


def test_zero_width_character_detection():
    payload = "Hello\u200bworld\u200c!"
    result = Normalizer.normalize(payload)
    assert result.has_zero_width_chars is True
    assert "zero_width_characters_detected" in result.detected_anomalies
    assert result.normalized_text == "Helloworld!"


def test_control_character_detection():
    payload = "Text with \x00 null and \x07 bell"
    result = Normalizer.normalize(payload)
    assert result.has_control_chars is True
    assert "control_characters_detected" in result.detected_anomalies


def test_whitespace_and_unicode_normalization():
    payload = "Line1\r\nLine2   with   spaces"
    result = Normalizer.normalize(payload)
    assert "Line1\nLine2 with spaces" in result.normalized_text


def test_benign_text_has_no_anomalies():
    payload = "Standard benign prompt for code review."
    result = Normalizer.normalize(payload)
    assert result.has_zero_width_chars is False
    assert result.has_control_chars is False
    assert len(result.detected_anomalies) == 0
