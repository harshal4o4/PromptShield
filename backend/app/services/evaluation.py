import os
import json
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from app.core.database import get_db_connection
from app.schemas.evaluation import (
    EvaluationResult,
    DatasetSummary,
    ConfusionMatrix,
    CategoryMetric,
    FailureCase
)
from app.services.detector import SecurityDetector
from app.services.policy_engine import PolicyEngine

DATASET_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "seed_dataset.jsonl")
DATASET_VERSION = "synthetic-v1.0"


class EvaluationService:
    def __init__(self, dataset_path: str = DATASET_PATH):
        self.dataset_path = dataset_path
        self.detector = SecurityDetector()
        self.policy_engine = PolicyEngine()

    def load_dataset(self) -> List[Dict[str, Any]]:
        records = []
        if not os.path.exists(self.dataset_path):
            return records
        with open(self.dataset_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    records.append(json.loads(line))
        return records

    def get_dataset_summary(self) -> DatasetSummary:
        records = self.load_dataset()
        malicious = sum(1 for r in records if r.get("ground_truth") == "malicious")
        benign = sum(1 for r in records if r.get("ground_truth") == "benign")
        categories: Dict[str, int] = {}
        for r in records:
            cat = r.get("category", "unclassified")
            categories[cat] = categories.get(cat, 0) + 1

        return DatasetSummary(
            version=DATASET_VERSION,
            total_samples=len(records),
            malicious_count=malicious,
            benign_count=benign,
            categories=categories
        )

    def run_evaluation(self) -> EvaluationResult:
        records = self.load_dataset()
        if not records:
            raise ValueError("Evaluation dataset is empty or not found.")

        tp = 0
        fp = 0
        tn = 0
        fn = 0

        failure_cases: List[FailureCase] = []
        category_stats: Dict[str, Dict[str, int]] = {}

        for rec in records:
            cat = rec.get("category", "unclassified")
            if cat not in category_stats:
                category_stats[cat] = {"total": 0, "tp": 0, "fp": 0, "tn": 0, "fn": 0}
            category_stats[cat]["total"] += 1

            text = rec["text"]
            source = rec.get("source_type", "user")
            ground_truth = rec.get("ground_truth", "benign")

            # Run actual security detector & policy engine
            det_res = self.detector.analyze(text=text, source_type=source)
            dec_res = self.policy_engine.evaluate(det_res)

            predicted_positive = (dec_res.decision in ["BLOCK", "SANITIZE", "ESCALATE"] or det_res.has_signals)
            actual_positive = (ground_truth == "malicious")

            if actual_positive and predicted_positive:
                tp += 1
                category_stats[cat]["tp"] += 1
            elif not actual_positive and not predicted_positive:
                tn += 1
                category_stats[cat]["tn"] += 1
            elif not actual_positive and predicted_positive:
                fp += 1
                category_stats[cat]["fp"] += 1
                failure_cases.append(
                    FailureCase(
                        id=rec["id"],
                        text_excerpt=text[:120],
                        ground_truth=ground_truth,
                        predicted_decision=dec_res.decision,
                        predicted_risk=dec_res.risk_level,
                        failure_type="false_positive",
                        rationale=f"Benign input flagged by {', '.join([s.rule_id for s in det_res.signals]) or 'policy'}."
                    )
                )
            elif actual_positive and not predicted_positive:
                fn += 1
                category_stats[cat]["fn"] += 1
                failure_cases.append(
                    FailureCase(
                        id=rec["id"],
                        text_excerpt=text[:120],
                        ground_truth=ground_truth,
                        predicted_decision=dec_res.decision,
                        predicted_risk=dec_res.risk_level,
                        failure_type="false_negative",
                        rationale=f"Malicious attack bypassed detection: {rec.get('rationale', 'Unknown attack vector')}."
                    )
                )

        # Metrics calculation with safe zero-denominator handling
        precision = round(tp / (tp + fp), 4) if (tp + fp) > 0 else 0.0
        recall = round(tp / (tp + fn), 4) if (tp + fn) > 0 else 0.0
        f1_score = round(2 * (precision * recall) / (precision + recall), 4) if (precision + recall) > 0 else 0.0
        fpr = round(fp / (fp + tn), 4) if (fp + tn) > 0 else 0.0

        # Category metrics
        cat_metrics: Dict[str, CategoryMetric] = {}
        for cat, stats in category_stats.items():
            c_tp = stats["tp"]
            c_fp = stats["fp"]
            c_fn = stats["fn"]
            c_prec = round(c_tp / (c_tp + c_fp), 4) if (c_tp + c_fp) > 0 else 0.0
            c_rec = round(c_tp / (c_tp + c_fn), 4) if (c_tp + c_fn) > 0 else 0.0
            c_f1 = round(2 * (c_prec * c_rec) / (c_prec + c_rec), 4) if (c_prec + c_rec) > 0 else 0.0
            cat_metrics[cat] = CategoryMetric(
                category=cat,
                total=stats["total"],
                true_positives=c_tp,
                false_positives=c_fp,
                precision=c_prec,
                recall=c_rec,
                f1_score=c_f1
            )

        run_id = str(uuid.uuid4())
        run_at = datetime.now(timezone.utc).isoformat()
        conf_matrix = ConfusionMatrix(
            true_positives=tp,
            false_positives=fp,
            true_negatives=tn,
            false_negatives=fn
        )

        result = EvaluationResult(
            id=run_id,
            run_at=run_at,
            dataset_version=DATASET_VERSION,
            total_samples=len(records),
            precision=precision,
            recall=recall,
            f1_score=f1_score,
            false_positive_rate=fpr,
            confusion_matrix=conf_matrix,
            category_metrics=cat_metrics,
            failure_cases=failure_cases
        )

        # Persist to database
        with get_db_connection() as conn:
            conn.execute(
                """
                INSERT INTO evaluation_runs (
                    id, run_at, dataset_version, total_samples,
                    precision, recall, f1_score, false_positive_rate,
                    true_positives, false_positives, true_negatives, false_negatives,
                    category_metrics_json, failure_cases_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    run_id,
                    run_at,
                    DATASET_VERSION,
                    len(records),
                    precision,
                    recall,
                    f1_score,
                    fpr,
                    tp,
                    fp,
                    tn,
                    fn,
                    json.dumps({k: v.model_dump() for k, v in cat_metrics.items()}),
                    json.dumps([fc.model_dump() for fc in failure_cases])
                )
            )

        return result

    def get_latest_result(self) -> Optional[EvaluationResult]:
        with get_db_connection() as conn:
            row = conn.execute(
                "SELECT * FROM evaluation_runs ORDER BY run_at DESC LIMIT 1"
            ).fetchone()
            if not row:
                return None

            cat_metrics_raw = json.loads(row["category_metrics_json"])
            cat_metrics = {k: CategoryMetric(**v) for k, v in cat_metrics_raw.items()}

            failure_cases_raw = json.loads(row["failure_cases_json"])
            failure_cases = [FailureCase(**fc) for fc in failure_cases_raw]

            return EvaluationResult(
                id=row["id"],
                run_at=row["run_at"],
                dataset_version=row["dataset_version"],
                total_samples=row["total_samples"],
                precision=row["precision"],
                recall=row["recall"],
                f1_score=row["f1_score"],
                false_positive_rate=row["false_positive_rate"],
                confusion_matrix=ConfusionMatrix(
                    true_positives=row["true_positives"],
                    false_positives=row["false_positives"],
                    true_negatives=row["true_negatives"],
                    false_negatives=row["false_negatives"]
                ),
                category_metrics=cat_metrics,
                failure_cases=failure_cases
            )
