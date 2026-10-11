from app.services.evaluation import EvaluationService
from app.core.database import init_db


def test_evaluation_run_and_metrics():
    init_db()
    service = EvaluationService()
    result = service.run_evaluation()

    assert result.total_samples > 0
    assert 0.0 <= result.precision <= 1.0
    assert 0.0 <= result.recall <= 1.0
    assert 0.0 <= result.f1_score <= 1.0
    assert 0.0 <= result.false_positive_rate <= 1.0
    assert result.confusion_matrix.true_positives >= 0
    assert result.confusion_matrix.true_negatives >= 0

    # Ensure persistence works
    latest = service.get_latest_result()
    assert latest is not None
    assert latest.id == result.id
