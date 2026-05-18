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
});
