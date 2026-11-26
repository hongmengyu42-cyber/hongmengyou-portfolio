package com.example.portfolio.experience;

import java.util.List;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.example.portfolio.common.ResourceNotFoundException;

@Service
@Transactional
public class ExperienceService {

    private final ExperienceRepository repository;

    public ExperienceService(ExperienceRepository repository) {
        this.repository = repository;
    }

    @Cacheable("experience")
    @Transactional(readOnly = true)
    public List<ExperienceDtos.Response> list() {
        return repository.findAllByOrderByStartDateDescIdDesc().stream().map(ExperienceService::toResponse).toList();
    }

    @CacheEvict(cacheNames = "experience", allEntries = true)
    public ExperienceDtos.Response create(ExperienceDtos.Request request) {
        Experience entity = new Experience();
        apply(request, entity);
        return toResponse(repository.save(entity));
    }

    @CacheEvict(cacheNames = "experience", allEntries = true)
    public ExperienceDtos.Response update(Long id, ExperienceDtos.Request request) {
        Experience entity = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Experience", id));
        apply(request, entity);
        return toResponse(entity);
    }

    @CacheEvict(cacheNames = "experience", allEntries = true)
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Experience", id);
        }
        repository.deleteById(id);
    }

    private static void apply(ExperienceDtos.Request r, Experience e) {
        e.setCompany(r.company().strip());
        e.setRole(r.role().strip());
        e.setLocation(StringUtils.hasText(r.location()) ? r.location().strip() : null);
        e.setType(r.type());
        e.setStartDate(r.startDate());
        e.setEndDate(r.endDate());
        e.setDescription(r.description() == null ? "" : r.description().strip());
    }

    private static ExperienceDtos.Response toResponse(Experience e) {
        return new ExperienceDtos.Response(e.getId(), e.getCompany(), e.getRole(), e.getLocation(), e.getType(),
                e.getStartDate(), e.getEndDate(), e.getEndDate() == null, e.getDescription());
    }
}
