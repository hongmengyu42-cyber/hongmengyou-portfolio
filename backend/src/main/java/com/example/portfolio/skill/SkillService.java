package com.example.portfolio.skill;

import java.util.Comparator;
import java.util.List;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.portfolio.common.ResourceNotFoundException;

@Service
@Transactional
public class SkillService {

    private final SkillRepository skills;

    public SkillService(SkillRepository skills) {
        this.skills = skills;
    }

    // Every write evicts the cache, so the admin list can safely share the cached public list.
    @Cacheable("skills")
    @Transactional(readOnly = true)
    public List<SkillDtos.Response> list() {
        return skills.findAll().stream()
                .sorted(Comparator.comparing(Skill::getCategory)
                        .thenComparingInt(Skill::getDisplayOrder).thenComparing(Skill::getName))
                .map(SkillService::toResponse).toList();
    }

    @CacheEvict(cacheNames = "skills", allEntries = true)
    public SkillDtos.Response create(SkillDtos.Request request) {
        Skill skill = new Skill();
        apply(request, skill);
        return toResponse(skills.save(skill));
    }

    @CacheEvict(cacheNames = "skills", allEntries = true)
    public SkillDtos.Response update(Long id, SkillDtos.Request request) {
        Skill skill = skills.findById(id).orElseThrow(() -> new ResourceNotFoundException("Skill", id));
        apply(request, skill);
        return toResponse(skill);
    }

    @CacheEvict(cacheNames = "skills", allEntries = true)
    public void delete(Long id) {
        if (!skills.existsById(id)) {
            throw new ResourceNotFoundException("Skill", id);
        }
        skills.deleteById(id);
    }

    private static void apply(SkillDtos.Request request, Skill skill) {
        skill.setName(request.name().strip());
        skill.setCategory(request.category());
        skill.setLevel(request.level());
        skill.setDisplayOrder(request.displayOrder());
    }

    private static SkillDtos.Response toResponse(Skill s) {
        return new SkillDtos.Response(s.getId(), s.getName(), s.getCategory(), s.getLevel(), s.getDisplayOrder());
    }
}
