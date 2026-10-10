class ApiError(Exception):
    """An error the client caused, returned with its HTTP status and a safe message."""

    def __init__(self, status: int, message: str):
        super().__init__(message)
        self.status = status
        self.message = message
