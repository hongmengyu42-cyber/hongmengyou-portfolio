package com.example.portfolio.project;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;

/** Put on any method that changes project data, so public read caches never serve stale content. */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Caching(evict = {
        @CacheEvict(cacheNames = "projects", allEntries = true),
        @CacheEvict(cacheNames = "project-detail", allEntries = true),
        @CacheEvict(cacheNames = "seo-head", allEntries = true)
})
public @interface EvictProjectCaches {
}
