package com.ravitej.stormapi.execution.repo;

import com.ravitej.stormapi.execution.model.ApiTarget;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ApiTargetRepository extends JpaRepository<ApiTarget, Long> {

    List<ApiTarget> findByUserIdOrderByCreatedAtDesc(Long userId);
}
