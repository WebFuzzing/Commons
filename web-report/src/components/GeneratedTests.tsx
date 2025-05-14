import {Card} from "@/components/ui/card.tsx";
import {Target} from "lucide-react";
import type React from "react";

interface IGeneratedTests {
    total_tests: number
    total_test_files: number
}

export const GeneratedTests: React.FC<IGeneratedTests> = ({total_tests, total_test_files}) => (
    <Card className="border-2 border-black p-6 rounded-none">
        <div className="flex items-start gap-4">
            <Target className="w-6 h-6 text-gray-500"/>
            <div className="flex-1">
                <div className="flex justify-between">
                    <span className="text-lg font-bold">Generated Tests Cases:</span>
                    <span className="text-lg font-bold">{total_tests}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-lg font-bold">Generated Test Files:</span>
                    <span className="text-lg font-bold">{total_test_files}</span>
                </div>
            </div>
        </div>
    </Card>
)