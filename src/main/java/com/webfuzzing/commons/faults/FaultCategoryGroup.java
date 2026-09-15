package com.webfuzzing.commons.faults;

public enum FaultCategoryGroup {

    G_1XX("HTTP Faults"),
    G_2XX("Schema Faults"),
    G_3XX("Security Faults"),
    G_9XX("Custom Faults"),
    G_Others("Other Faults")
    ;

    public final String description;

    FaultCategoryGroup(String description) {
        this.description = description;
    }
}
