import {useState} from "react"
import {StatusCodeFilterButton} from "./StatusCodeFilterButton"
import {ITransformedReport} from "@/lib/utils.tsx";
import {StatusCodeModal} from "@/components/StatusCodeModal.tsx";

type FilterState = "inactive" | "active" | "removed"

interface StatusCodeFiltersProps {
    data: ITransformedReport[]
    onFiltersChange: (activeFilters: Record<number, FilterState>) => void
}

export function StatusCodeFilters({data, onFiltersChange}: StatusCodeFiltersProps) {

    // Extract all unique status codes from endpoints
    const allStatusCodes = [...new Map(
        data.flatMap(endpoint => endpoint.httpStatusCodes)
            .map(item => [item.code, item])
    ).values()].sort((a, b) => a.code - b.code);

    const allFaultCodes = [...new Set(data.map(item => {
        return item.faults.map(fault => fault.code)
    }).flat())].sort((a, b) => a - b);

    const initialFilters = allStatusCodes.reduce((acc, code) => {
        acc[code.code] = "inactive"
        return acc
    }, {} as Record<number, FilterState>)
    allFaultCodes.forEach(code => {
        initialFilters[-code] = "inactive"
    })
    const [filters, setFilters] = useState<Record<number, FilterState>>(initialFilters)

    // Handle filter state change
    const handleFilterChange = (code: number, state: FilterState) => {
        const newFilters = {...filters, [code]: state}

        setFilters(newFilters)
        onFiltersChange(newFilters)
    }

    const [isModalOpen, setIsModalOpen] = useState(false)


    return (
        <div className="mb-6">
            <div className="items-center mb-2">
                <h3 className="text-sm font-medium text-gray-700 mr-3">Filter by HTTP Status Code</h3>
                <div className="flex-wrap gap-2">
                    {allStatusCodes.map((code) => (
                        <StatusCodeFilterButton
                            key={code.code}
                            code={code.code}
                            initialState={filters[code.code] || "inactive"}
                            onChange={handleFilterChange}
                        />
                    ))}
                </div>
            </div>
            <div className="items-center mb-2">
                <h3 className="text-sm font-medium text-gray-700 mr-3">Filter by Fault Code</h3>
                <div className="flex-wrap gap-2">
                    {allFaultCodes.map((code) => (
                        <StatusCodeFilterButton
                            key={-code}
                            code={-code}
                            initialState={filters[-code] || "inactive"}
                            onChange={handleFilterChange}
                            isFault={true}
                        />
                    ))}
                </div>
            </div>
            <div className="text-xs text-gray-500 mt-1">Click to toggle: Default → Active → Removed → Default</div>
            <div className="items-center mb-2 flex justify-end">
                <div className="text-sm font-mono text-red-500 mt-1 cursor-help hover:text-green-300" onClick={() => setIsModalOpen(true)}>Code Documentation</div>
            </div>
            <div className="border-t border-black my-2"></div>
            <StatusCodeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} statusCode={-1} />
        </div>
    )
}
