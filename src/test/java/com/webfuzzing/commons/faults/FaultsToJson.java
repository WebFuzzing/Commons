package com.webfuzzing.commons.faults;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.MapperFeature;
import tools.jackson.databind.json.JsonMapper;


import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

public class FaultsToJson {

    public static final String JSON_OUTPUT_FILEPATH = "src/main/resources/wfc/faults/fault_categories.json";

    public static void main(String[] args) {

        String json = getJsonFromClass();

        try {
            Files.write(Paths.get(JSON_OUTPUT_FILEPATH), json.getBytes());
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public static String getJsonFromClass(){

        JsonMapper mapper = JsonMapper.builder()
                .enable(MapperFeature.SORT_PROPERTIES_ALPHABETICALLY)
                /*
                    We don't want to have dependencies to Jackson in generated POJOs.
                    But, for enum of DefinedFaultCategory, we want it printed as object...
                    created a MixIn seems the only way to achieve this in Jackson...
                    so convoluted!!!
                 */
                .addMixIn(DefinedFaultCategory.class, DefinedFaultCategoryMixIn.class)
                .build();

        List<DefinedFaultCategory> faults = Arrays.stream(DefinedFaultCategory.values())
                .sorted(Comparator.comparingInt(DefinedFaultCategory::getCode))
                .collect(Collectors.toList());

        String json = null;
        try {
            json = mapper
                    .writerWithDefaultPrettyPrinter()
                    .writeValueAsString(faults);
        } catch (JacksonException e) {
            throw new RuntimeException(e);
        }

        return json;
    }

    public static String getJsonFromFile(){

        String json = null;
        try {
            json = new String(Files.readAllBytes(Paths.get(JSON_OUTPUT_FILEPATH)));
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        return json;
    }
}
