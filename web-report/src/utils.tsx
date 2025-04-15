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
    startLine: number,
    endLine: number
): string => {
    const lines: string[] = fileContent.split('\n');

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