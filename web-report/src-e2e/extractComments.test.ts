import {describe, it, expect} from "vitest";
import {extractComments} from "../src/lib/utils";

describe("extractComments", () => {
    it("extracts Python # line comments above a test", () => {
        const code = [
            "    # Calls:",
            "    # (415) POST:/v2/pet/{petId}/uploadImage",
            "    # Found 1 potential fault of type-code 101",
            "    @timeout_decorator.timeout(60)",
            "    def test_23_post_on_uploadImage_returnsMismatchResponseWithSchema(self):",
            "        pass",
        ].join("\n");

        expect(extractComments(code)).toBe(
            [
                "Calls:",
                "(415) POST:/v2/pet/{petId}/uploadImage",
                "Found 1 potential fault of type-code 101",
            ].join("\n"),
        );
    });

    it("extracts Java /** */ Javadoc blocks", () => {
        const code = [
            "    /**",
            "     * Calls:",
            "     * (200) GET:/pets",
            "     */",
            "    @Test",
            "    public void test_1() { }",
        ].join("\n");

        expect(extractComments(code)).toBe(["Calls:", "(200) GET:/pets"].join("\n"));
    });

    it("extracts // line comments", () => {
        const code = [
            "    // Calls:",
            "    // (200) GET:/pets",
            "    public void test() { }",
        ].join("\n");

        expect(extractComments(code)).toBe(["Calls:", "(200) GET:/pets"].join("\n"));
    });

    it("separates distinct comment blocks with a blank line", () => {
        const code = [
            "# first block",
            "# more of first block",
            "",
            "code_line()",
            "# second block",
        ].join("\n");

        expect(extractComments(code)).toBe(
            ["first block\nmore of first block", "second block"].join("\n\n"),
        );
    });

    it("returns empty string when there are no comments", () => {
        const code = ["def test():", "    pass"].join("\n");
        expect(extractComments(code)).toBe("");
    });

    it("handles a single-line /* ... */ block", () => {
        const code = ["/* hello world */", "def f(): pass"].join("\n");
        expect(extractComments(code)).toBe("hello world");
    });

    describe("comments embedded inside a statement are dropped, not shown as documentation", () => {
        it("drops a commented-out line in the middle of a fluent method chain (Java/Kotlin style)", () => {
            const code = [
                "    // Explains the call below",
                "    given().accept(\"*/*\")",
                "            .options(url)",
                "            .then()",
                "            .assertThat()",
                "            // .header(\"allow\", \"GET,POST\")",
                "            .body(isEmptyOrNullString())",
            ].join("\n");

            expect(extractComments(code)).toBe("Explains the call below");
        });

        it("drops a commented-out line in the middle of a promise chain (JS style)", () => {
            const code = [
                "fetch(url)",
                "    .then(res => res.json())",
                "    // .then(data => expect(data.length).toBe(3))",
                "    .then(data => console.log(data));",
            ].join("\n");

            expect(extractComments(code)).toBe("");
        });

        it("drops a commented-out line in the middle of a builder chain (C#/fluent-API style)", () => {
            const code = [
                "var result = builder",
                "    .WithName(\"test\")",
                "    // .WithFlag(true)",
                "    .Build();",
            ].join("\n");

            expect(extractComments(code)).toBe("");
        });

        it("drops a commented-out argument inside a wrapped, multi-line call (Python style)", () => {
            const code = [
                "result = do_something(",
                "    value,",
                "    # extra_debug_flag,",
                ")",
            ].join("\n");

            expect(extractComments(code)).toBe("");
        });

        it("drops several consecutive commented-out lines that all continue the same chain", () => {
            const code = [
                "obj.step1()",
                "    .step2()",
                "    // .step3(true)",
                "    // .step4(false)",
                "    .step5()",
            ].join("\n");

            expect(extractComments(code)).toBe("");
        });

        it("drops a single-line block comment embedded in the middle of a chain", () => {
            const code = [
                "chain()",
                "    .a()",
                "    /* .b() */",
                "    .c()",
            ].join("\n");

            expect(extractComments(code)).toBe("");
        });

        it("drops a multi-line block comment embedded in the middle of a chain", () => {
            const code = [
                "chain()",
                "    .a()",
                "    /*",
                "     * disabled: .b(true)",
                "     */",
                "    .c()",
            ].join("\n");

            expect(extractComments(code)).toBe("");
        });
    });

    describe("comments that introduce a fresh statement are kept as documentation", () => {
        it("keeps a comment describing an independent statement in the middle of a function body", () => {
            const code = [
                "doFirstThing()",
                "// Now verify the second call behaves correctly",
                "doSecondThing()",
            ].join("\n");

            expect(extractComments(code)).toBe("Now verify the second call behaves correctly");
        });

        it("keeps a comment that trails the last statement with nothing following it", () => {
            const code = [
                "doWork()",
                "// Cleanup performed automatically by the test runner",
            ].join("\n");

            expect(extractComments(code)).toBe("Cleanup performed automatically by the test runner");
        });

        it("keeps documentation comments preceding each of several independent statements", () => {
            const code = [
                "/**",
                " * Calls:",
                " * 1 - (201) PUT:/orders/{id}",
                " * 2 - (200) GET:/orders/{id}",
                " */",
                "fun test() {",
                "",
                "    // First call replaces the resource",
                "    given().put(url)",
                "            .then()",
                "            .statusCode(201)",
                "",
                "    // Second call reads it back",
                "    given().get(url)",
                "            .then()",
                "            .statusCode(200)",
                "}",
            ].join("\n");

            expect(extractComments(code)).toBe(
                [
                    "Calls:\n1 - (201) PUT:/orders/{id}\n2 - (200) GET:/orders/{id}",
                    "First call replaces the resource",
                    "Second call reads it back",
                ].join("\n\n"),
            );
        });

        it("keeps a comment immediately followed by an opening call, not a continuation", () => {
            const code = [
                "// Builds the request payload",
                "buildPayload(",
                "    field1,",
                "    field2,",
                ")",
            ].join("\n");

            expect(extractComments(code)).toBe("Builds the request payload");
        });
    });
});
