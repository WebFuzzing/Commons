package com.webfuzzing.commons.schemas;

import com.networknt.schema.*;
import com.networknt.schema.Error;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class SchemaValidationTest {


    @Test
    public void testAuthSchema(){
        String schema = readTextFile("src/main/resources/wfc/schemas/auth.yaml");
        validateYamlSchema(schema);
    }

    @Test
    public void testReportSchema(){
        String schema = readTextFile("src/main/resources/wfc/schemas/report.yaml");
        validateYamlSchema(schema);
    }


    private String readTextFile(String diskLocation){
        try {
            return new String(Files.readAllBytes(Paths.get(diskLocation)));
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    private void validateYamlSchema(String schemaYaml){


        SchemaRegistry registry = SchemaRegistry.withDefaultDialect(SpecificationVersion.DRAFT_2020_12);

        Schema schema = registry.getSchema(SchemaLocation.of("https://json-schema.org/draft/2020-12/schema"));

        List<Error> errors = schema.validate(schemaYaml, InputFormat.YAML);

        assertEquals(0, errors.size(),
                "Errors: " + String.join(", ",
                        errors.stream().map(it -> it.toString()).collect(Collectors.joining(", ")))
        );
    }
}
