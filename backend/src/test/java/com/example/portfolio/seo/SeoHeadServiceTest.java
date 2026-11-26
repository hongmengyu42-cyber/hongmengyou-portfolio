package com.example.portfolio.seo;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class SeoHeadServiceTest {

    @Test
    void jsonStringCannotBreakOutOfAScriptTag() {
        String encoded = SeoHeadService.jsonString("</script><script>alert(1)</script>\"\\");
        assertThat(encoded).doesNotContain("<").doesNotContain(">");
        assertThat(encoded).startsWith("\"").endsWith("\"");
    }

    @Test
    void onlyKnownPathShapesBecomeCacheKeys() {
        assertThat(SeoHeadService.normalize("/projects/my-app")).isEqualTo("/projects/my-app");
        assertThat(SeoHeadService.normalize("/projects/../admin")).isEqualTo("/");
        assertThat(SeoHeadService.normalize("/anything-else")).isEqualTo("/");
        assertThat(SeoHeadService.normalize(null)).isEqualTo("/");
    }
}
