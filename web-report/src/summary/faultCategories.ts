import faultCategories from "../../../src/main/resources/wfc/faults/fault_categories.json";

export interface FaultCategoryInfo {
    id: string | null;
    code: number;
    name: string;
    label: string;
    description: string | null;
}

export const getFaultCategoryInfo = (code: number): FaultCategoryInfo => {
    const found = faultCategories.find(f => f.code === code);
    if (found) {
        return {id: found.id, code, name: found.descriptiveName, label: found.label, description: found.fullDescription};
    }
    const name = code >= 900 && code <= 999 ? "Custom Code" : "Unrecognized Code";
    return {id: null, code, name, label: `F${code}:${name}`, description: null};
};
