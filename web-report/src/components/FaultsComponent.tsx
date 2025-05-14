import {Card} from "@/components/ui/card.tsx";
import {ShieldAlert} from "lucide-react";
import type React from "react";
import {Faults} from "@/types/GeneratedTypes.tsx";

export const FaultsComponent: React.FC<Faults> = ({total_number, found_faults}) => {
    const faultCounts = new Map();
    //TODO make this calculation in utils and test it.
    found_faults.forEach(fault => {
        fault.fault_categories.forEach(category => {
            faultCounts.set(category.code, (faultCounts.get(category.code) || 0) + 1);
        });
    });

    return(
        <Card className="border-2 border-black p-6 rounded-none">
            <div className="flex items-start gap-4 mb-4">
                <ShieldAlert className="w-6 h-6 text-gray-500" />
                <div className="flex-1">
                    <div className="flex justify-between">
                        <span className="text-lg font-bold">Total Faults</span>
                        <span className="text-lg font-bold" data-testid="faults-component-total-faults">{total_number}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-lg font-bold">Distinct Fault Types:</span>
                        <span className="text-lg font-bold" data-testid="faults-component-fault-counts">{faultCounts.size}</span>
                    </div>
                </div>
            </div>

            <div className="mt-4">
                <div className="flex justify-between font-bold border-b border-black pb-2">
                    <span>Codes</span>
                    <span>#</span>
                </div>
                <div className="border-2 border-black mt-2 p-2">
                    {
                        Array.from(faultCounts).map(([code, count]) => (
                            <div className="flex justify-between py-1" key={code}>
                                <span className="font-bold">{code}</span>
                                <span className="font-bold">{count}</span>
                            </div>
                        ))
                    }
                </div>
            </div>
        </Card>
    )
}