import {AlertTriangle, Code, ArrowRight} from "lucide-react"
import {ZodIssue} from "zod";

interface ErrorDisplayProps {
    title?: string
    description?: string
    issues?: ZodIssue[]
}

export function ErrorDisplay({
                                 title = "Error",
                                 description = "Invalid report format. Please ensure the report is generated correctly.",
                                 issues = [],
                             }: ErrorDisplayProps) {

    const getIssueTypeColor = (code: string) => {
        switch (code) {
            case "invalid_type":
                return "bg-red-50 border-red-200 text-red-800"
            default:
                return "bg-gray-50 border-gray-200 text-gray-800"
        }
    }

    const getPathString = (path: (string | number)[]) => {
        return path.length > 0 ? path.join(".") : "root"
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="text-center mb-6">
                <div className="flex items-center justify-center mb-3">
                    <AlertTriangle className="w-12 h-12 text-red-500 mr-3"/>
                    <h1 className="text-4xl font-bold text-gray-900">{title}</h1>
                </div>
                <p className="text-lg text-gray-600">{description}</p>
            </div>

            {issues.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center mb-4">
                        <div className="h-px bg-gray-300 flex-1"></div>
                        <span className="px-4 text-sm font-medium text-gray-500">
              {issues.length} Validation Issue{issues.length !== 1 ? "s" : ""}
            </span>
                        <div className="h-px bg-gray-300 flex-1"></div>
                    </div>

                    {issues.map((issue, index) => (
                        <div
                            key={index}
                            className={`rounded-lg border-2 p-6 transition-all duration-200 hover:shadow-md ${getIssueTypeColor(issue.code)}`}
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                                <div className="space-y-2">
                                    <div className="flex items-center">
                                        <Code className="w-4 h-4 mr-2 opacity-70"/>
                                        <span className="font-mono text-sm font-semibold uppercase tracking-wide">
                      {issue.code.replace("_", " ")}
                    </span>
                                    </div>
                                    <div className="font-mono text-lg font-bold">{getPathString(issue.path)}</div>
                                </div>
                                <div className="flex justify-center">
                                    <ArrowRight className="w-6 h-6 opacity-50"/>
                                </div>
                                {issue.code === "invalid_type" &&
                                <div className="space-y-3">
                                    <div className="text-base font-medium">{issue.message}</div>
                                    <div
                                        className="flex flex-col space-y-2">
                                        <div className="flex items-center">
                                            <span className="text-sm text-gray-600 mr-2">Expected:</span>
                                            <span
                                                className="px-2 py-1 bg-green-100 text-green-800 rounded font-mono text-sm font-medium">
                                                    {issue.expected}
                                             </span>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="text-sm text-gray-600 mr-2">Received:</span>
                                            <span
                                                className="px-2 py-1 bg-red-100 text-red-800 rounded font-mono text-sm font-medium">
                                            {issue.received}
                                          </span>
                                        </div>
                                    </div>
                                </div>
                                }
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {issues.length === 0 && (
                <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-8 h-8 text-gray-400"/>
                    </div>
                    <p className="text-gray-500">No detailed validation issues available.</p>
                </div>
            )}
        </div>
    )
}