import {useEffect, useRef, useState} from "react"
import info from "@/assets/info.json";
import {ChevronDown, ChevronUp} from "lucide-react";

interface FaultCode {
    short_definition: string
    code: number
    description: string
    test_case_name: string
}

interface StatusCodeModalProps {
    isOpen: boolean
    onClose: () => void
    statusCode: number
}

export function StatusCodeModal({ isOpen, onClose, statusCode }: StatusCodeModalProps) {
    const faultCodes = info.fault_codes;
    const [expandedCode, setExpandedCode] = useState<number | null>(null)
    const selectedCodeRef = useRef<HTMLDivElement>(null)
    const modalContentRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // Auto-expand the selected status code when modal opens
        if (isOpen && statusCode) {
            setExpandedCode(statusCode)

            // Use a small timeout to ensure the DOM has updated before scrolling
            setTimeout(() => {
                if (selectedCodeRef.current) {
                    selectedCodeRef.current.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                    })
                }
            }, 100)
        }
    }, [isOpen, statusCode])

    if (!isOpen) return null

    // Group fault codes by their first digit (category)
    const groupedFaultCodes: { [key: string]: FaultCode[] } = {}
    faultCodes.forEach((fc) => {
        const category = Math.floor(fc.code / 100) * 100
        if (!groupedFaultCodes[category]) {
            groupedFaultCodes[category] = []
        }
        groupedFaultCodes[category].push(fc)
    })

    // Get category names
    const getCategoryName = (category: number): string => {
        switch (category) {
            case 100:
                return "HTTP Issues"
            case 200:
                return "Schema Issues"
            case 300:
                return "GraphQL Issues"
            case 400:
                return "RPC Issues"
            case 500:
                return "Web Issues"
            case 800:
                return "Security Issues"
            default:
                return "Other Issues"
        }
    }

    const getCategoryGroup = (category: number): string => {
        switch (category) {
            case 100:
                return "1xx"
            case 200:
                return "2xx"
            case 300:
                return "3xx"
            case 400:
                return "4xx"
            case 500:
                return "5xx"
            case 800:
                return "8xx"
            default:
                return "xxx"
        }
    }

    const toggleExpanded = (code: number) => {
        setExpandedCode(expandedCode === code ? null : code)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Semi-transparent overlay */}
            <div className="absolute inset-0 bg-gray-500 opacity-95" onClick={onClose}></div>

            {/* Modal Content */}
            <div className="relative bg-white rounded-lg shadow-lg w-4/5 max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                <div className="sticky top-0 z-10 bg-gray-100 p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold">Fault Codes</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 focus:outline-none">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 overflow-auto flex-1" ref={modalContentRef}>
                    <div className="space-y-6">
                        {Object.keys(groupedFaultCodes)
                            .map(Number)
                            .sort((a, b) => a - b)
                            .map((category) => (
                                <div key={category} className="border rounded-lg overflow-hidden">
                                    <div
                                        className={`p-3 font-medium ${
                                            Math.floor(statusCode / 100) * 100 === category
                                                ? "bg-blue-100 text-blue-800"
                                                : "bg-gray-50 text-gray-700"
                                        }`}
                                    >
                                        {getCategoryName(category)} ({getCategoryGroup(category)})
                                    </div>
                                    <div className="divide-y">
                                        {groupedFaultCodes[category].map((fc) => (
                                            <div key={fc.code} id={`fault-code-${fc.code}`}>
                                                <div
                                                    ref={fc.code === statusCode ? selectedCodeRef : null}
                                                    className={`p-3 flex items-center hover:bg-gray-50 cursor-pointer ${
                                                        fc.code === statusCode ? "bg-blue-50" : ""
                                                    }`}
                                                    onClick={() => toggleExpanded(fc.code)}
                                                >
                                                    <div className="w-16 font-mono">{fc.code}</div>
                                                    <div className="flex-1">{fc.short_definition}</div>
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className={`w-3 h-3 rounded-full ${
                                                                fc.code === statusCode ? "bg-blue-500" : "bg-gray-300"
                                                            }`}
                                                        ></div>
                                                        {expandedCode === fc.code ? (
                                                            <ChevronUp className="w-4 h-4" />
                                                        ) : (
                                                            <ChevronDown className="w-4 h-4" />
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Expanded Content */}
                                                {expandedCode === fc.code && (
                                                    <div className="bg-gray-50 p-4 border-t">
                                                        <div className="space-y-4">
                                                            <div>
                                                                <h4 className="font-semibold text-gray-800 mb-2">Description</h4>
                                                                <p className="text-gray-700">{fc.description}</p>
                                                                <p className="text-gray-600 mt-2">
                                                                    <span className="font-medium">Test Case Name:</span> {fc.test_case_name}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
