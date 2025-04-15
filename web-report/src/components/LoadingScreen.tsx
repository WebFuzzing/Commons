import React from "react"
import {Loader2} from "lucide-react"
import {cn} from "@/lib/utils"

interface LoadingScreenProps {
    title?: string
    message?: string
    showProgress?: boolean
    className?: string
    onComplete?: () => void
    duration?: number
}

export const LoadingScreen: React.FC = ({
                                            title = "Loading...",
                                            message = "Please wait, files are loading...",
                                            className,
                                        }: LoadingScreenProps) => {


    return (
        <div className={cn("fixed inset-0 z-50 flex flex-col items-center justify-center bg-background", className)}>
            <div className="flex flex-col items-center justify-center space-y-8 px-4 text-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary"/>
                {title && <h1 className="text-3xl font-bold tracking-tight"> {title} </h1>}
                {
                    message && <p className="text-muted-foreground"> {message} </p>}
            </div>
        </div>
    )
}

