import {CoveredEndpoint, FoundFault} from "@/types/GeneratedTypes.tsx";

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

export const calculateAllStatusCounts = (covered_http_status: CoveredEndpoint[], endpoint_ids:string[]) => {
    const allStatusCounts ={
        "2XX": 0,
        "3XX": 0,
        "4XX": 0,
        "5XX": 0
    }

    endpoint_ids.map(
        (endpoint) => {
            const allStatusCodes = covered_http_status.filter(status => status.endpoint_id === endpoint)
                .map(
                    (status) => status.http_status
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

export const getFaultCounts = (found_faults: FoundFault[]) => {
    const faultCounts = new Map();
    found_faults.forEach(fault => {
        fault.fault_categories.forEach(category => {
            faultCounts.set(category.code, (faultCounts.get(category.code) || 0) + 1);
        });
    });
    return faultCounts;
}