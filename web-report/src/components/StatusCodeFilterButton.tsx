import { useState } from "react"
import {Badge} from "@/components/ui/badge.tsx";

type FilterState = "inactive" | "active" | "removed"

interface StatusCodeFilterButtonProps {
    code: number
    initialState?: FilterState
    onChange: (code: number, state: FilterState) => void,
    isFault?: boolean
}

export function StatusCodeFilterButton({ code, initialState = "inactive", onChange, isFault }: StatusCodeFilterButtonProps) {
    const [state, setState] = useState<FilterState>(initialState)

    const getBackgroundColor = () => {
        if(isFault) {
            return "bg-red-500"
        }
        if (code == -1) return "bg-gray-500"
        if (code >= 200 && code < 300) return "bg-green-500"
        if (code >= 300 && code < 400) return "bg-blue-500"
        if (code >= 400 && code < 500) return "bg-orange-500"
        if (code >= 500) return "bg-red-500"
        return "bg-gray-500"
    }

    const getStyles = () => {
        const baseStyles = `${getBackgroundColor()} cursor-pointer text-white font-mono rounded-full px-5 py-1 transition-all duration-200`

        switch (state) {
            case "active":
                return `${baseStyles} ring-2 ring-offset-2 ring-offset-white ring-blue-400 shadow-md`
            case "removed":
                return `${baseStyles} opacity-50 line-through`
            default:
                return `${baseStyles} opacity-80 hover:opacity-100`
        }
    }

    const toggleState = () => {
        const newState: FilterState = state === "inactive" ? "active" : state === "active" ? "removed" : "inactive"
        setState(newState)
        if(isFault){
            onChange(code, newState)
        }
        onChange(code, newState)
    }

    return (
        <Badge className={getStyles()} onClick={toggleState}>
            {isFault ? `F${-1 * code}`: code == -1 ? `NO-RESPONSE`:`H${code}`}
        </Badge>
    )
}
