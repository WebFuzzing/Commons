package com.webfuzzing.commons.faults;

public interface FaultCategory {

    /**
     * A unique string that uniquely identify this fault category.
     * This id is meant to be stable, and should not change among different releases of WFC.
     * Fuzzer developers should be able to rely on these ids not changing.
     * If for any reason an id must be changed, then that would trigger a new major release of WFC.
     * Note the "code" are meant to be stable as well, however, those "might" change between minor releases.
     */
    public String getId();


    /**
     * A unique, 3-digit code identifying this fault category
     */
    public int getCode();

    /**
     * A short descriptive name to explain the category
     */
    public String getDescriptiveName();

    /**
     * A short label that can be used in test case naming
     */
    public String getTestCaseLabel();

    /**
     * A full, lengthy description of this fault category.
     * It should not contain any special formatting, as this field will be used for documentation
     * in different context, eg, markdown and HTML.
     */
    public String getFullDescription();

    /**
     * A descriptive identifier for this category.
     * Not a full, lengthy description.
     * For example based on code and name
     */
    public default String getLabel() {
        return "F" + getCode() + ":" + getDescriptiveName();
    }

    public default FaultCategoryGroup getGroup() {

        int code = getCode();
        if(code >= 100 && code < 199){
            return FaultCategoryGroup.G_1XX;
        }
        if(code >= 200 && code < 300){
            return FaultCategoryGroup.G_2XX;
        }
        if(code >= 300 && code < 400){
            return FaultCategoryGroup.G_3XX;
        }
        if(code >= 900 && code < 1_000){
            return FaultCategoryGroup.G_9XX;
        }
        return FaultCategoryGroup.G_Others;
    }
}
