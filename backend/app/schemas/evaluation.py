from typing import Dict, List, Optional
from pydantic import BaseModel


class ConfusionMatrix(BaseModel):
    true_positives: int
    false_positives: int
    true_negatives: int
    false_negatives: int


class CategoryMetric(BaseModel):
    category: str
    total: int
    true_positives: int
    false_positives: int
    precision: float
    recall: float
    f1_score: float


class FailureCase(BaseModel):
    id: str
    text_excerpt: str
    ground_truth: str
    predicted_decision: str
    predicted_risk: str
    failure_type: str  # "false_positive" or "false_negative"
    rationale: str


class EvaluationResult(BaseModel):
    id: str
    run_at: str
    dataset_version: str
    total_samples: int
    precision: float
    recall: float
    f1_score: float
    false_positive_rate: float
    confusion_matrix: ConfusionMatrix
    category_metrics: Dict[str, CategoryMetric]
    failure_cases: List[FailureCase]


class DatasetSummary(BaseModel):
    version: str
    total_samples: int
    malicious_count: int
    benign_count: int
    categories: Dict[str, int]
