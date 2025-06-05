package com.webfuzzing.commons.faults;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

public class FaultsToJson {

    public static final String JSON_OUTPUT_FILEPATH = "src/main/resources/wfc/faults/fault_categories.json";

    public static void main(String[] args) throws Exception {

        String json = getJsonFromClass();

        Files.write(Paths.get(JSON_OUTPUT_FILEPATH), json.getBytes());
    }

    public static String getJsonFromClass(){
        ObjectMapper mapper = new ObjectMapper();

        List<DefinedFaultCategory> faults = Arrays.stream(DefinedFaultCategory.values())
                .sorted(Comparator.comparingInt(DefinedFaultCategory::getCode))
                .collect(Collectors.toList());

        String json = null;
        try {
            json = mapper
                    .writerWithDefaultPrettyPrinter()
                    .writeValueAsString(faults);
        } catch (JsonProcessingException e) {
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
