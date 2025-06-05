import React, { useState } from "react"
import { ChevronRight, Code } from "lucide-react"
import {getColor} from "@/lib/utils.tsx";

interface TestCaseButtonProps {
    testName: string
    statusCode: number | string
    onClick: (value: string, event: React.MouseEvent<HTMLElement>) => void
    isFault: boolean
}

export function TestCaseButton({ testName, statusCode, onClick, isFault }: TestCaseButtonProps) {
    const [isHovered, setIsHovered] = useState(false)

    return (
        <button
            className={`w-full group flex items-center justify-between p-4 mb-2 border rounded-lg transition-all duration-200 ${
                isHovered
                    ? "bg-blue-50 border-blue-300 shadow-md transform translate-y-[-1px]"
                    : "bg-white border-gray-200 hover:bg-blue-50 hover:border-blue-300"
            }`}
            onClick={(event) => onClick(testName, event)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex items-center">
                <Code
                    className={`mr-3 ${isHovered ? "text-blue-600" : "text-gray-500"} transition-colors duration-200`}
                    size={20}
                />
                <span className="font-mono text-sm text-left">{testName}</span>
            </div>
            <div className="flex items-center">
                <span className={`font-bold mr-2 ${getColor(statusCode, false, isFault)}`}>{statusCode}</span>
                <ChevronRight
                    className={`${
                        isHovered ? "text-blue-600 transform translate-x-1" : "text-gray-400"
                    } transition-all duration-200`}
                    size={18}
                />
            </div>
        </button>
    )
}
