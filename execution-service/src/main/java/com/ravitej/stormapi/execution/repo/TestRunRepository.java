package com.ravitej.stormapi.execution.repo;

import com.ravitej.stormapi.execution.model.TestRun;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface TestRunRepository extends JpaRepository<TestRun, Long> {

    long countByStatus(String status);

    List<TestRun> findByTestConfigIdInOrderByStartedAtDesc(Collection<Long> configIds);
}
