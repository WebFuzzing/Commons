package com.webfuzzing.commons.faults;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class FaultsToJsonTest {


    @Test
    public void testUpdatedJson() {

        /*
            if this method fails, need to recreate JSON file with FaultsToJson
         */
        String current = FaultsToJson.getJsonFromClass();
        String file = FaultsToJson.getJsonFromFile();
        assertEquals(current, file);
    }
}
