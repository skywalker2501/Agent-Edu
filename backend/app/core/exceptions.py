from typing import Any, Dict, Optional
from fastapi import HTTPException, status


class AgentEduException(HTTPException):
    def __init__(
        self,
        status_code: int,
        detail: str,
        error_code: str = "AGENTEDU_ERROR",
        extra: Optional[Dict[str, Any]] = None
    ):
        super().__init__(status_code=status_code, detail=detail)
        self.error_code = error_code
        self.extra = extra or {}


class AuthenticationError(AgentEduException):
    def __init__(self, detail: str = "Invalid authentication credentials"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            error_code="AUTHENTICATION_FAILED"
        )


class PermissionDeniedError(AgentEduException):
    def __init__(self, detail: str = "You do not have permission to perform this action"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            error_code="PERMISSION_DENIED"
        )


class ResourceNotFoundError(AgentEduException):
    def __init__(self, resource: str, resource_id: Any):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource} with ID '{resource_id}' was not found",
            error_code="RESOURCE_NOT_FOUND",
            extra={"resource": resource, "resource_id": str(resource_id)}
        )


class InvalidStateTransitionError(AgentEduException):
    def __init__(self, workflow: str, current_state: str, attempted_state: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid state transition in {workflow}: cannot transition from '{current_state}' to '{attempted_state}'",
            error_code="INVALID_STATE_TRANSITION",
            extra={"workflow": workflow, "current_state": current_state, "attempted_state": attempted_state}
        )


class GovernanceViolationError(AgentEduException):
    def __init__(self, reason: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Governance validation failed: {reason}",
            error_code="GOVERNANCE_BLOCKED",
            extra=details or {}
        )


class DuplicateSubmissionError(AgentEduException):
    def __init__(self, attempt_id: str):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Assessment attempt '{attempt_id}' has already been submitted and graded",
            error_code="DUPLICATE_SUBMISSION",
            extra={"attempt_id": attempt_id}
        )
