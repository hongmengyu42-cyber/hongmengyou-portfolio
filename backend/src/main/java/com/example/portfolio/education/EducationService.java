package com.example.portfolio.education;

import java.util.List;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.example.portfolio.common.ResourceNotFoundException;

@Service
@Transactional
public class EducationService {

    private final EducationRepository education;
    private final CertificationRepository certifications;

    public EducationService(EducationRepository education, CertificationRepository certifications) {
        this.education = education;
        this.certifications = certifications;
    }

    // ---- education ----

    @Cacheable("education")
    @Transactional(readOnly = true)
    public List<EducationDtos.Response> listEducation() {
        return education.findAllByOrderByStartDateDescIdDesc().stream().map(EducationService::toResponse).toList();
    }

    @CacheEvict(cacheNames = "education", allEntries = true)
    public EducationDtos.Response createEducation(EducationDtos.Request request) {
        Education entity = new Education();
        apply(request, entity);
        return toResponse(education.save(entity));
    }

    @CacheEvict(cacheNames = "education", allEntries = true)
    public EducationDtos.Response updateEducation(Long id, EducationDtos.Request request) {
        Education entity = education.findById(id).orElseThrow(() -> new ResourceNotFoundException("Education", id));
        apply(request, entity);
        return toResponse(entity);
    }

    @CacheEvict(cacheNames = "education", allEntries = true)
    public void deleteEducation(Long id) {
        if (!education.existsById(id)) {
            throw new ResourceNotFoundException("Education", id);
        }
        education.deleteById(id);
    }

    // ---- certifications ----

    @Cacheable("certifications")
    @Transactional(readOnly = true)
    public List<EducationDtos.CertificationResponse> listCertifications() {
        return certifications.findAllByOrderByIssuedOnDescIdDesc().stream()
                .map(EducationService::toResponse).toList();
    }

    @CacheEvict(cacheNames = "certifications", allEntries = true)
    public EducationDtos.CertificationResponse createCertification(EducationDtos.CertificationRequest request) {
        Certification entity = new Certification();
        apply(request, entity);
        return toResponse(certifications.save(entity));
    }

    @CacheEvict(cacheNames = "certifications", allEntries = true)
    public EducationDtos.CertificationResponse updateCertification(Long id,
            EducationDtos.CertificationRequest request) {
        Certification entity = certifications.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Certification", id));
        apply(request, entity);
        return toResponse(entity);
    }

    @CacheEvict(cacheNames = "certifications", allEntries = true)
    public void deleteCertification(Long id) {
        if (!certifications.existsById(id)) {
            throw new ResourceNotFoundException("Certification", id);
        }
        certifications.deleteById(id);
    }

    private static void apply(EducationDtos.Request r, Education e) {
        e.setInstitution(r.institution().strip());
        e.setDegree(r.degree().strip());
        e.setFieldOfStudy(StringUtils.hasText(r.fieldOfStudy()) ? r.fieldOfStudy().strip() : null);
        e.setStartDate(r.startDate());
        e.setEndDate(r.endDate());
        e.setDescription(r.description() == null ? "" : r.description().strip());
    }

    private static void apply(EducationDtos.CertificationRequest r, Certification c) {
        c.setName(r.name().strip());
        c.setIssuer(r.issuer().strip());
        c.setIssuedOn(r.issuedOn());
        c.setCredentialUrl(StringUtils.hasText(r.credentialUrl()) ? r.credentialUrl().strip() : null);
    }

    private static EducationDtos.Response toResponse(Education e) {
        return new EducationDtos.Response(e.getId(), e.getInstitution(), e.getDegree(), e.getFieldOfStudy(),
                e.getStartDate(), e.getEndDate(), e.getDescription());
    }

    private static EducationDtos.CertificationResponse toResponse(Certification c) {
        return new EducationDtos.CertificationResponse(c.getId(), c.getName(), c.getIssuer(), c.getIssuedOn(),
                c.getCredentialUrl());
    }
}
