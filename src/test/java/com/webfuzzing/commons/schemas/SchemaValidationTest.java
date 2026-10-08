package com.webfuzzing.commons.schemas;

import com.networknt.schema.*;
import com.networknt.schema.Error;
import com.networknt.schema.dialect.Dialect;
import com.networknt.schema.dialect.Dialects;
import com.networknt.schema.keyword.DisallowUnknownKeywordFactory;
import com.networknt.schema.keyword.KeywordFactory;
import com.networknt.schema.keyword.NonValidationKeyword;
import com.networknt.schema.output.OutputUnit;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
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

        /*
            By default, JSON Schema ignores unknown properties.
            This means that a misspelled "requird" will be silently ignored.
            We want to crash in those cases.
            However, we need support "x-" properties (ie, don't crush on those)
         */

        KeywordFactory strictKeywordFactory = (keyword, schemaContext) -> {
            if (keyword.startsWith("x-")) {
                return new NonValidationKeyword(keyword);
            }

            return DisallowUnknownKeywordFactory
                    .getInstance()
                    .getKeyword(keyword, schemaContext);
        };

        Dialect strictDialect = Dialect.builder(Dialects.getDraft202012())
                .unknownKeywordFactory(strictKeywordFactory)
                .build();

        SchemaRegistry registry = SchemaRegistry.withDialect(strictDialect);

        //should crash if errors
        registry.getSchema(schemaYaml, InputFormat.YAML);
    }
}
