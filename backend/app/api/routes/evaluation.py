from typing import Optional
from fastapi import APIRouter, HTTPException, status
from app.schemas.evaluation import EvaluationResult, DatasetSummary
from app.services.evaluation import EvaluationService

router = APIRouter(prefix="/api/v1/evaluation", tags=["Evaluation"])


@router.get("/dataset", response_model=DatasetSummary)
def get_dataset_summary():
    """Summary of the labelled benchmark dataset."""
    service = EvaluationService()
    return service.get_dataset_summary()


@router.post("/run", response_model=EvaluationResult)
def run_evaluation():
    """Execute evaluation run against labelled dataset, compute precision/recall/F1, and persist results."""
    service = EvaluationService()
    return service.run_evaluation()


@router.get("/latest", response_model=Optional[EvaluationResult])
def get_latest_evaluation():
    """Retrieve most recent persisted evaluation result."""
    service = EvaluationService()
    result = service.get_latest_result()
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No evaluation run found. Please trigger an evaluation run."
        )
    return result
