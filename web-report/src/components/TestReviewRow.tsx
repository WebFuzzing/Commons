import React, {useEffect, useState} from "react";
import {Code, ChevronRight} from "lucide-react";
import {useAppContext} from "@/AppProvider.tsx";
import {ReviewState, SELECTABLE_REVIEW_STATES} from "@/types/Review.ts";

interface IProps {
    testId: string;
    testName: string;
    onOpen: (testId: string) => void;
}

const stateBadgeClass = (state: ReviewState): string => {
    switch (state) {
        case "ACCEPTED":
            return "bg-green-100 border-green-500 text-green-800";
        case "REJECTED":
            return "bg-red-100 border-red-500 text-red-800";
        case "PREVIOUSLY-ACCEPTED":
            return "bg-green-50 border-green-300 text-green-700";
        case "PREVIOUSLY-REJECTED":
            return "bg-red-50 border-red-300 text-red-700";
        case "NOT-REVIEWED":
        default:
            return "bg-gray-100 border-gray-400 text-gray-700";
    }
};

const TestReviewRowInner: React.FC<IProps> = ({testId, testName, onOpen}) => {
    const {getReview, setReviewState, setReviewComment} = useAppContext();
    const review = getReview(testId);

    // Local state for the comment textarea keeps typing from re-rendering the entire
    // list on every keystroke; we only commit to the shared context on blur.
    const [localComment, setLocalComment] = useState(review.comment);
    useEffect(() => {
        setLocalComment(review.comment);
    }, [review.comment]);

    return (
        <div
            className={`border-2 p-3 mb-2 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-start ${stateBadgeClass(review.state)}`}
            data-testid={`test-review-row-${testId}`}
        >
            <button
                onClick={() => onOpen(testId)}
                className="flex items-center text-left hover:underline"
                data-testid={`test-review-open-${testId}`}
            >
                <Code className="mr-2 text-gray-600 shrink-0" size={18}/>
                <span className="font-mono text-sm break-all">{testName}</span>
                <ChevronRight className="ml-1 text-gray-400 shrink-0" size={16}/>
            </button>

            <select
                value={review.state}
                onChange={(e) => setReviewState(testId, e.target.value as ReviewState)}
                className={`font-mono text-xs border-2 border-black px-2 py-1 bg-white ${stateBadgeClass(review.state)}`}
                data-testid={`test-review-state-${testId}`}
            >
                {SELECTABLE_REVIEW_STATES.map(s => (
                    <option key={s} value={s}>{s}</option>
                ))}
                {!SELECTABLE_REVIEW_STATES.includes(review.state) && (
                    <option key={review.state} value={review.state} disabled>
                        {review.state}
                    </option>
                )}
            </select>

            <textarea
                value={localComment}
                onChange={(e) => setLocalComment(e.target.value)}
                onBlur={() => {
                    if (localComment !== review.comment) {
                        setReviewComment(testId, localComment);
                    }
                }}
                placeholder="Comment (optional)"
                rows={2}
                className="w-full border border-gray-400 p-2 text-sm font-mono resize-y bg-white"
                data-testid={`test-review-comment-${testId}`}
            />
        </div>
    );
};

export const TestReviewRow = React.memo(TestReviewRowInner);
