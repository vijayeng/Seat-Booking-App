export type SeatHoldRequest = {
  seatId: string;
};

export type SeatHoldValidationResult =
  | {
      success: true;
      data: SeatHoldRequest;
    }
  | {
      success: false;
      error: string;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateSeatHoldRequest(body: unknown): SeatHoldValidationResult {
  if (!isRecord(body)) {
    return {
      success: false,
      error: "Request body must be a JSON object.",
    };
  }

  const rawSeatId = body.seatId;
  const seatId =
    typeof rawSeatId === "string"
      ? rawSeatId.trim()
      : typeof rawSeatId === "number" && Number.isFinite(rawSeatId)
        ? String(rawSeatId)
        : "";

  if (!seatId) {
    return {
      success: false,
      error: "seatId is required.",
    };
  }

  return {
    success: true,
    data: {
      seatId,
    },
  };
}
