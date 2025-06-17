import {CoveredEndpoint, FoundFault, WebFuzzingCommonsReport} from "@/types/GeneratedTypes.tsx";
import {ClassValue, clsx} from "clsx";
import {twMerge} from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export const getColor = (code: string | number, isBackground: boolean, isFault: boolean) => {
    if (isFault) {
        return isBackground ? "bg-red-500" : "text-red-500";
    }
    if (typeof code === "number") {
        return getColorNumber(code, isBackground);
    }
    return isBackground ? "bg-red-500" : "text-red-500";
}


const getColorNumber = (code: number, isBackground: boolean) => {
    if (code >= 200 && code < 300) return isBackground ? "bg-green-500" : "text-green-500";
    if (code >= 300 && code < 400) return isBackground ? "bg-blue-500" : "text-blue-500";
    if (code >= 400 && code < 500) return isBackground ? "bg-orange-500" : "text-orange-500";
    if (code >= 500) return isBackground ? "bg-red-500" : "text-red-500";
};

export const fetchFileContent = async (filePath: string): Promise<string | object> => {
    try {
        const response = await fetch(filePath);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (filePath.endsWith('.json')) {
            return await response.json() as object;
        } else {
            return await response.text();
        }
    } catch (error) {
        console.error('Error fetching file:', error);
        throw error;
    }
}

export const extractCodeLines = (
    fileContent: string,
    startLine: number | undefined,
    endLine: number  | undefined
): string => {
    const lines: string[] = fileContent.split('\n');

    if(!startLine || !endLine){
        return "";
    }

    const startIndex: number = Math.max(0, startLine);
    const endIndex: number = Math.min(lines.length - 1, endLine - 1);

    if (startIndex > endIndex) {
        throw new Error('Start line cannot be greater than end line');
    }
    if (startIndex >= lines.length || endIndex >= lines.length) {
        throw new Error('Line numbers are out of range');
    }

    return lines.slice(startIndex, endIndex + 2).join('\n');
};

export const calculateAllStatusCounts = (coveredHttpStatus: CoveredEndpoint[], endpointIds:string[]) => {
    const allStatusCounts ={
        "2XX": 0,
        "3XX": 0,
        "4XX": 0,
        "5XX": 0
    }

    endpointIds.map(
        (endpoint) => {
            const allStatusCodes = coveredHttpStatus.filter(status => status.endpointId === endpoint)
                .map(
                    (status) => status.httpStatus
                ).flat()
            const uniqueStatusCodes = [...new Set(allStatusCodes)];

            const isContainStatusCode = {
                "2XX": false,
                "3XX": false,
                "4XX": false,
                "5XX": false
            }

            uniqueStatusCodes.map(
                (status) => {
                    if (status >= 200 && status < 300) {
                        isContainStatusCode["2XX"] = true;
                    } else if (status >= 300 && status < 400) {
                        isContainStatusCode["3XX"] = true;
                    } else if (status >= 400 && status < 500) {
                        isContainStatusCode["4XX"] = true;
                    } else if (status >= 500 && status < 600) {
                        isContainStatusCode["5XX"] = true;
                    }
                }
            )

            if (isContainStatusCode["2XX"]) {
                allStatusCounts["2XX"]++;
            }
            if (isContainStatusCode["3XX"]) {
                allStatusCounts["3XX"]++;
            }
            if (isContainStatusCode["4XX"]) {
                allStatusCounts["4XX"]++;
            }
            if (isContainStatusCode["5XX"]) {
                allStatusCounts["5XX"]++;
            }
        }
    )
    return allStatusCounts;
}

export const getFaultCounts = (foundFaults: FoundFault[]) => {
    const faultCounts = new Map();
    // A fault defines a unique operationId, code, and context. To define a unique fault, we can use a combination of these three properties.

    foundFaults.forEach(fault => {
        fault.faultCategories.forEach(category => {
            faultCounts.set(`${fault.operationId}|${category.code}|${category.context}`, (faultCounts.get(category.code) || 0) + 1);
        });
    });

    const uniqueFaults = Array.from(faultCounts.keys()).map(key => {
        const [operationId, code, context] = key.split('|');
        return {
            operationId: operationId,
            code: parseInt(code, 10),
            context: context || '',
            count: faultCounts.get(key)
        };
    });
    const uniqueCodes = new Set(uniqueFaults.map(fault => fault.code));
    
    return Array.from(uniqueCodes).map(code => {
        const faultsWithCode = uniqueFaults.filter(fault => fault.code === code);
        const uniqueOperationCounts = new Set(faultsWithCode.map(fault => fault.operationId)).size;
        return {
            code: code,
            count: faultsWithCode.length,
            operationCount: uniqueOperationCounts,
        }
    }).sort((a, b) => a.code - b.code);
}

export const getFileColor = (index: number, file: string) => {
    const isFault = file.includes("fault");
    const isSuccess = file.includes("success");
    const isOthers = file.includes("other");

    if(isFault) {
        return "bg-red-500";
    }

    if(isSuccess) {
        return "bg-green-500";
    }

    if(isOthers) {
        return "bg-yellow-500";
    }

    const colorList = ["bg-blue-500", "bg-green-500", "bg-red-500", "bg-yellow-500", "bg-purple-500", "bg-pink-500"];

    return colorList[index % colorList.length];
}

export const getLanguage = (fileName: string) => {

    switch (fileName.split('.').pop()) {
        case 'java':
            return 'java';
        case 'js':
            return 'javascript';
        case 'py':
            return 'python';
        case 'ts':
            return 'typescript';
        case 'kt':
            return 'kotlin';
        default:
            return 'plaintext';
    }
}

export interface ITransformedReport {
    endpoint: string;
    faults: {
        code: number;
        testCases: string[];
    }[];
    httpStatusCodes: {
        code: number;
        testCases: string[];
    }[];
}

export const transformWebFuzzingReport = (original: WebFuzzingCommonsReport | null): Array<ITransformedReport> => {

    if (!original || !original.problemDetails || !original.problemDetails.rest) {
        return [];
    }

    const endpointMap = new Map<string, ITransformedReport>();

    original.problemDetails.rest?.endpointIds.forEach(endpoint => {
        endpointMap.set(endpoint, {
            endpoint,
            httpStatusCodes: [],
            faults: []
        });
    });

    original.faults.foundFaults.forEach(fault => {
        if (!fault.operationId) {
            return;
        }

        if (!endpointMap.has(fault.operationId)) {
            console.log(`Endpoint ${fault.operationId} not found in endpointIds`);
        }

        const endpointData = endpointMap.get(fault.operationId);

        if (!endpointData) {
            return;
        }

        fault.faultCategories.forEach(faultCat => {
            let existingFault = endpointData.faults.find((f: { code: number; }) => f.code === faultCat.code);
            if (!existingFault) {
                existingFault = {code: faultCat.code, testCases: []};
                endpointData.faults.push(existingFault);
            }
            if (!existingFault.testCases.includes(fault.testCaseId)) {
                existingFault.testCases.push(fault.testCaseId);
            }
        });
    });

    if (original.problemDetails.rest == null) {
        return Array.from([]);
    }

    original.problemDetails.rest.coveredHttpStatus.forEach(status => {
        if (!endpointMap.has(status.endpointId)) {
            console.log(`Endpoint ${status.endpointId} not found in endpointIds`);
        }

        const endpointData = endpointMap.get(status.endpointId);

        status.httpStatus.forEach(code => {
            if (!endpointData) {
                return;
            }
            let existingStatus = endpointData.httpStatusCodes.find((s: { code: number; }) => s.code === code);
            if (!existingStatus) {
                existingStatus = {code, testCases: []};
                endpointData.httpStatusCodes.push(existingStatus);
            }
            if (!existingStatus.testCases.includes(status.testCaseId)) {
                existingStatus.testCases.push(status.testCaseId);
            }
        });
    });

    return Array.from(endpointMap.values());
}

export const getText = (
    text: string,
    params?: Record<string, string | number>): string => {

    return Object.entries(params || {}).reduce((result, [param, value]) => {
        return result.replace(`{${param}}`, String(value));
    }, text);
}