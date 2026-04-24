export const REVIEW_STATE = {
    NOT_REVIEWED: "NOT-REVIEWED",
    ACCEPTED: "ACCEPTED",
    REJECTED: "REJECTED",
    PREVIOUSLY_ACCEPTED: "PREVIOUSLY-ACCEPTED",
    PREVIOUSLY_REJECTED: "PREVIOUSLY-REJECTED",
} as const;

export type ReviewState = typeof REVIEW_STATE[keyof typeof REVIEW_STATE];

export const REVIEW_STATES: readonly ReviewState[] = Object.values(REVIEW_STATE);

export const SELECTABLE_REVIEW_STATES: readonly ReviewState[] = [
    REVIEW_STATE.NOT_REVIEWED,
    REVIEW_STATE.ACCEPTED,
    REVIEW_STATE.REJECTED,
];

export interface TestReview {
    state: ReviewState;
    comment: string;
}

export const DEFAULT_REVIEW: TestReview = {state: REVIEW_STATE.NOT_REVIEWED, comment: ""};

export interface ReviewFile {
    schemaVersion: string;
    reviews: Record<string, TestReview>;
}

export const REVIEW_FILE_NAME = "report-review.json";
export const REVIEW_SCHEMA_VERSION = __WFC_VERSION__;

export const isReviewState = (v: unknown): v is ReviewState =>
    typeof v === "string" && (REVIEW_STATES as readonly string[]).includes(v);

export const normalizeReviews = (
    reviews: Record<string, TestReview>,
): Record<string, TestReview> => {
    const out: Record<string, TestReview> = {};
    for (const [id, r] of Object.entries(reviews)) {
        const comment = (r.comment ?? "").trim();
        if (r.state !== REVIEW_STATE.NOT_REVIEWED || comment !== "") {
            out[id] = {state: r.state, comment: r.comment ?? ""};
        }
    }
    return out;
};

const sortedStringify = (obj: Record<string, TestReview>): string => {
    const keys = Object.keys(obj).sort();
    const sorted: Record<string, TestReview> = {};
    for (const k of keys) sorted[k] = obj[k];
    return JSON.stringify(sorted);
};

export const reviewsEqual = (
    a: Record<string, TestReview>,
    b: Record<string, TestReview>,
): boolean => sortedStringify(normalizeReviews(a)) === sortedStringify(normalizeReviews(b));

export const parseReviewFile = (raw: unknown): Record<string, TestReview> => {
    if (!raw || typeof raw !== "object") {
        throw new Error("Invalid review file: not a JSON object.");
    }
    const obj = raw as Record<string, unknown>;
    const reviews = obj.reviews;
    if (!reviews || typeof reviews !== "object") {
        throw new Error("Invalid review file: missing 'reviews' object.");
    }
    const out: Record<string, TestReview> = {};
    for (const [id, entry] of Object.entries(reviews as Record<string, unknown>)) {
        if (!entry || typeof entry !== "object") {
            throw new Error(`Invalid review entry for '${id}': not an object.`);
        }
        const e = entry as Record<string, unknown>;
        if (!isReviewState(e.state)) {
            throw new Error(`Invalid review entry for '${id}': unknown state '${String(e.state)}'.`);
        }
        const comment = typeof e.comment === "string" ? e.comment : "";
        out[id] = {state: e.state, comment};
    }
    return out;
};
