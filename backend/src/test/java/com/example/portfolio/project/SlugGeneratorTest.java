package com.example.portfolio.project;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Set;

import org.junit.jupiter.api.Test;

class SlugGeneratorTest {

    @Test
    void slugifiesAccentsSymbolsAndSpaces() {
        assertThat(SlugGenerator.slugify("Café Müller API!")).isEqualTo("cafe-muller-api");
        assertThat(SlugGenerator.slugify("  --Hello   World--  ")).isEqualTo("hello-world");
    }

    @Test
    void fallsBackWhenNothingUsableRemains() {
        assertThat(SlugGenerator.slugify("???")).isEqualTo("project");
    }

    @Test
    void truncatesVeryLongNames() {
        assertThat(SlugGenerator.slugify("a".repeat(300))).hasSize(100);
    }

    @Test
    void appendsSuffixUntilFree() {
        Set<String> taken = Set.of("demo", "demo-2");
        assertThat(SlugGenerator.unique("demo", taken::contains)).isEqualTo("demo-3");
        assertThat(SlugGenerator.unique("fresh", taken::contains)).isEqualTo("fresh");
    }
}
